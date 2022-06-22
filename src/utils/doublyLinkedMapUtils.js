import _ from 'lodash'

export function instance() {
  return {
    headKey: null,
    tailKey: null,
    nodes: {}
  }
}

export const getItems = (map) =>
  _.map(map.nodes, node => node.data)

export const getItem = (map, key) =>
  map.nodes[key].data

export const getItemMetadata = (map, key) =>
  map.nodes[key].metadata

const getNextKey = (map, key) =>
  key == null ? map.headKey : map.nodes[key].nextKey

const getPrevKey = (map, key) =>
  key == null ? map.tailKey : map.nodes[key].prevKey

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

export function sortAndLinkItems(map, keys, keyComparator) {
  keys = keys.sort(keyComparator)
  const linkedKeys = keyIterator(map)

  let linkedKeyNext = linkedKeys.next()
  let keyIndex = 0

  while (!linkedKeyNext.done && keyIndex < keys.length) {
    const key = keys[keyIndex]
    const linkedKey = linkedKeyNext.value

    if (keyComparator(linkedKey, key) < 0) {
      const linkedNode = map.nodes[linkedKey]
      linkItem(map, linkedNode.prevKey, key, linkedKey)
      keyIndex++
    } else linkedKeyNext = linkedKeys.next()
  }

  for (; keyIndex < keys.length; keyIndex++)
    linkItem(map, map.tailKey, keys[keyIndex], null)
}

export function removeItem(map, key) {
  const node = map.nodes[key]
  if (!node) return false

  setNextItem(map, node.prevKey, node.nextKey)
  delete map.nodes[key]

  return true
}

export function addUnlinkedItem(map, key, item) {
  const replaced = removeItem(map, key)
  map.nodes[key] = {
    data: item,
    metadata: {},
    prevKey: null,
    nextKey: null
  }

  return replaced
}

export function sortItems(map, keyComparator) {
  const keys = [...keyIterator(map)].sort(keyComparator)

  let prevKey = null
  for (const key of keys) {
    setNextItem(map, prevKey, key)
    prevKey = key
  }

  setNextItem(map, prevKey, null)
}
