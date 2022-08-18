import _ from 'lodash'

/**
 * @namespace DlMapTypes
 */

/**
 * @template Key, Value, Metadata
 * @typedef {object} DlMapTypes.Node
 * @property {Value} value The value of the item
 * @property {Metadata} metadata Metadata for the item
 * @property {Key} prevKey The key of the previous item
 * @property {Key} nextKey The key of the next item
 */

/**
 * A kind of {@link https://www.geeksforgeeks.org/linkedhashmap-class-in-java/|LinkedHashMap}
 *
 * @template Key, Value, Metadata
 * @typedef {object} DlMapTypes.Map
 * @property {Key} headKey The key of the first item
 * @property {Key} tailKey The key of the last item
 * @property {Object<Key, DlMapTypes.Node<Key, Value, Metadata>>} nodes The map nodes
 */

/**
 * Returns a new doubly linked map instance
 *
 * @template Key, Value, Metadata
 * @returns {DlMapTypes.Map<Key, Value, Metadata>} A new instance
 */
export function instance() {
  return {
    headKey: null,
    tailKey: null,
    nodes: {}
  }
}

/**
 * Returns the values of all items in the map in a non-standard order
 *
 * @template Key, Value, Metadata
 * @param {DlMapTypes.Map<Key, Value, Metadata>} map A map instance
 * @returns {Value[]} The values of the nodes in map
 */
export const getItems = (map) =>
  _.map(map.nodes, node => node.value)

/**
 * Returns the value of the item with the given key
 *
 * @template Key, Value, Metadata
 * @param {DlMapTypes.Map<Key, Value, Metadata>} map A map instance
 * @param {Key} key The key of an item
 * @returns {?Value} The value of the item, or undefined if it wasn't found
 */
export const getItem = (map, key) =>
  map.nodes[key]?.value

/**
 * Returns the metadata of the item with the given key
 *
 * @template Key, Value, Metadata
 * @param {DlMapTypes.Map<Key, Value, Metadata>} map A map instance
 * @param {Key} key The key of an item
 * @returns {?Metadata} The metadata of the item, or undefined if it wasn't found
 */
export const getItemMetadata = (map, key) =>
  map.nodes[key]?.metadata

const getNextKey = (map, key) =>
  key == null ? map.headKey : map.nodes[key].nextKey

const getPrevKey = (map, key) =>
  key == null ? map.tailKey : map.nodes[key].prevKey

/**
 * Returns the next or previous key of the one given, and the first or last key if a key isn't given
 *
 * @template Key, Value, Metadata
 * @generator
 * @param {DlMapTypes.Map<Key, Value, Metadata>} map A map instance
 * @param {boolean} [forward=true] True to yield the next key, or false to yield the previous one
 * @param {Key} [key] The key to start from, or null to start from the beginning
 * @yields {Key?} The next or previous key
 */
export function * keyIterator(map, forward = true, key = null) {
  const _getNextKey = forward ? getNextKey : getPrevKey
  while (true) {
    key = _getNextKey(map, key)
    if (key == null) return

    yield key
  }
}

function setNextItem(map, key, nextKey) {
  const { [nextKey]: nextNode, [key]: node } = map.nodes

  if (nextNode)
    nextNode.prevKey = key
  else
    map.tailKey = key

  if (node)
    node.nextKey = nextKey
  else
    map.headKey = nextKey
}

function linkItem(map, prevKey, key, nextKey) {
  setNextItem(map, prevKey, key)
  setNextItem(map, key, nextKey)
}

/**
 * @template Key
 * @callback KeyComparator
 * @param {Key} first The key of an item
 * @param {Key} second The key of another item
 * @returns {number}
 * Should return:
 * - 1, if the first item should be placed after the second
 * - -1, if the first item should be placed before the second
 */

/**
 * Links items inserted using {@link addUnlinkedItem} in the correct position
 *
 * @template Key, Value, Metadata
 * @param {DlMapTypes.Map<Key, Value, Metadata>} map A map instance
 * @param {Key[]} keys The keys of the items to link
 * @param {KeyComparator} keyComparator A function that compares two items
 */
export function sortAndLinkItems(map, keys, keyComparator) {
  keys = keys.sort(keyComparator)
  const linkedKeys = keyIterator(map)

  let linkedKeyNext = linkedKeys.next()
  let keyIndex = 0

  while (!linkedKeyNext.done && keyIndex < keys.length) {
    const key = keys[keyIndex]
    const linkedKey = linkedKeyNext.value

    if (keyComparator(linkedKey, key) > 0) {
      const linkedNode = map.nodes[linkedKey]
      linkItem(map, linkedNode.prevKey, key, linkedKey)
      keyIndex++
    } else linkedKeyNext = linkedKeys.next()
  }

  for (; keyIndex < keys.length; keyIndex++)
    linkItem(map, map.tailKey, keys[keyIndex], null)
}

/**
 * Deletes an item from the map by its key
 *
 * @template Key, Value, Metadata
 * @param {DlMapTypes.Map<Key, Value, Metadata>} map A map instance
 * @param {Key} key The key of the item to delete
 * @returns {Value|void} Returns the value of the item if it existed, or undefined if it didn't
 */
export function deleteItem(map, key) {
  const node = map.nodes[key]
  if (!node) return

  setNextItem(map, node.prevKey, node.nextKey)
  delete map.nodes[key]
  return node.value
}

/**
 * Adds an item to the map, but doesn't link it yet. The linking is done by {@link sortAndLinkItems}
 *
 * @template Key, Value, Metadata
 * @param {DlMapTypes.Map<Key, Value, Metadata>} map A map instance
 * @param {Key} key The new of the new item
 * @param {Value} value The value of the new item
 * @param {Metadata} metadata The metadata of the new item
 * @returns {boolean} Returns true if an item with the same value existed and was replaced
 */
export function addUnlinkedItem(map, key, value, metadata) {
  const isReplacing = deleteItem(map, key) !== undefined
  map.nodes[key] = {
    metadata,
    value,
    prevKey: null,
    nextKey: null
  }

  return isReplacing
}

/**
 * Changes the order of the items according to the new key comparator
 *
 * @template Key, Value, Metadata
 * @param {DlMapTypes.Map<Key, Value, Metadata>} map A map instance
 * @param {KeyComparator} keyComparator A function that compares two items
 */
export function sortItems(map, keyComparator) {
  // Way faster than quicksort written in javascript, I tried it
  const keys = [...keyIterator(map)].sort(keyComparator)

  let prevKey = null
  for (const key of keys) {
    setNextItem(map, prevKey, key)
    prevKey = key
  }

  setNextItem(map, prevKey, null)
}
