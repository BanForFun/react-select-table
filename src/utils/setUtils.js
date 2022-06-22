import _ from 'lodash'

export function instance() {
  return { }
}

export function removeItem(set, key) {
  return delete set[key]
}

export function addItem(set, key) {
  set[key] = true
}

export function toggleItem(set, key, exists) {
  const action = exists ? addItem : removeItem
  action(set, key)
}

export function hasItem(set, key) {
  return set[key] === true
}

export function getItems(set) {
  return Object.keys(set)
}

export function isEmpty(set) {
  return _.isEmpty(set)
}

export function isEqual(setA, setB) {
  return _.isEqual(setA, setB)
}
