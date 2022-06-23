import * as setUtils from './setUtils'
import _ from 'lodash'

/**
 * @template Value
 * @typedef {object} TrieNode
 * @property {Object<string, TrieNode<Value>>} children The children of the node
 * @property {import('../utils/setUtils').Set<Value>} values The values of the nodes that end at this character
 */

export function instance() {
  return {
    values: setUtils.instance(),
    children: {}
  }
}

export function addNode(node, value, text) {
  if (!text) return setUtils.addItem(node.values, value)

  const letter = text[0]
  const child = (node.children[letter] ??= instance())

  return addNode(child, value, text.substring(1))
}

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

function getAllKeys(node, keys = []) {
  if (!node) return keys

  keys.push(...setUtils.getItems(node.values))
  _.forEach(node.children, child => getAllKeys(child, keys))
  return keys
}

export function getMatchingKeys(node, text) {
  const textRoot = findNode(node, text)
  return getAllKeys(textRoot)
}
