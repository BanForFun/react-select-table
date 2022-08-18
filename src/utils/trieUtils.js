import * as setUtils from './setUtils'
import _ from 'lodash'

/**
 * @namespace TrieTypes
 */

/**
 * A node of a {@link https://en.wikipedia.org/wiki/Trie|trie}
 *
 * @template Value
 * @typedef {object} TrieTypes.Node
 * @property {Object<string, TrieTypes.Node<Value>>} children The children of the node
 * @property {import('../utils/setUtils').Set<Value>} values The values of the nodes that end at this character
 */

/**
 * Returns a new node instance
 *
 * @template Value
 * @returns {TrieTypes.Node<Value>} A new node
 */
export function instance() {
  return {
    values: setUtils.instance(),
    children: {}
  }
}

/**
 * Adds a new node to the trie
 *
 * @template Value
 * @param {TrieTypes.Node<Value>} node The node under which to place the new one
 * @param {Value} value The value of the new node
 * @param {string} text The text of the new node
 * @returns {void}
 */
export function addNode(node, value, text) {
  if (!text) {
    setUtils.addItem(node.values, value)
    return
  }

  const letter = text[0]
  const child = (node.children[letter] ??= instance())

  addNode(child, value, text.substring(1))
}

/**
 * Removes a node from the trie
 *
 * @template Value
 * @param {TrieTypes.Node<Value>} node The node under which the node to remove was placed originally
 * @param {Value} value The value of the node to remove
 * @param {string} text The text of the node to remove
 * @returns {boolean} True if the node existed
 */
export function removeNode(node, value, text) {
  if (!node) return
  if (!text) {
    setUtils.removeItem(node.values, value)
    return true
  }

  const char = text[0]
  const child = node.children[char]

  // If value did not exist, don't check whether to delete parent nodes
  if (!removeNode(child, value, text.substring(1))) return

  // If other nodes depend on this node, don't check whether to delete parent nodes
  if (!_.isEmpty(child.children)) return

  // If other values depend on this node, don't check whether to delete parent nodes
  if (!setUtils.isEmpty(child.values)) return

  // Node is not needed anymore
  delete node.children[char]

  // Return true to check whether to delete parent nodes as well
  return true
}

function findNode(node, text) {
  if (!node) return
  if (!text) return node

  const char = text[0]
  const child = node.children[char]

  return findNode(child, text.substring(1))
}

function getAllValues(node, values = []) {
  if (!node) return values

  values.push(...setUtils.getItems(node.values))
  _.forEach(node.children, child => getAllValues(child, values))
  return values
}

/**
 * Returns the values of all nodes whose text begins with the text given
 *
 * @template Value
 * @param {TrieTypes.Node<Value>} node The node from which to begin the search
 * @param {string} text The text to find matching values for
 * @returns {Value[]} The values of the nodes that match the given text
 */
export function getMatchingValues(node, text) {
  const textRoot = findNode(node, text)
  return getAllValues(textRoot)
}
