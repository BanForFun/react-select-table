import * as setUtils from './setUtils'
import _ from 'lodash'

export function instance() {
  return {
    keys: setUtils.instance(),
    children: {}
  }
}

export function addNode(node, key, text) {
  if (!text) return setUtils.addItem(node.keys, key)

  const letter = text[0]
  const child = (node.children[letter] ??= instance())

  return addNode(child, key, text.substring(1))
}

export function removeNode(node, key, text) {
  if (!node) return
  if (!text) return setUtils.removeItem(node.keys, key)

  const letter = text[0]
  const child = node.children[letter]

  // If key did not exist, don't check whether to delete parent nodes
  if (!removeNode(child, key, text.substring(1))) return

  // If other nodes depend on this node, don't check whether to delete parent nodes
  if (!_.isEmpty(child.children)) return

  // If other values depend on this node, don't check whether to delete parent nodes
  if (!setUtils.isEmpty(child.keys)) return

  // Node is not needed anymore
  delete node.children[letter]

  // Return true to check whether to delete parent nodes as well
  return true
}

function findNode(node, text) {
  if (!node) return
  if (!text) return node

  const letter = text[0]
  const child = node.children[letter]

  return findNode(child, text.substring(1))
}

function getAllKeys(node, keys = []) {
  if (!node) return keys

  keys.push(...setUtils.getItems(node.keys))
  _.forEach(node.children, child => getAllKeys(child, keys))
  return keys
}

export function getMatchingKeys(node, text) {
  const textRoot = findNode(node, text)
  return getAllKeys(textRoot)
}
