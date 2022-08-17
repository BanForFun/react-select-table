import _ from 'lodash'

/**
 * A {@link https://en.wikipedia.org/wiki/Set_(abstract_data_type)|Set}, implemented as an object with true as values
 *
 * @template Value
 * @typedef {Object<Value, boolean>} Set
 */

/**
 * Returns a new set instance
 *
 * @template Value
 * @returns {Set<Value>} A new set
 */
export function instance() {
  return { }
}

/**
 * Removes a value from a set
 *
 * @template Value
 * @param {Set<Value>} set The set that contains the value to remove
 * @param {Value} value The value to remove
 */
export function removeItem(set, value) {
  delete set[value]
}

/**
 * Adds a value to a set
 *
 * @template Value
 * @param {Set<Value>} set The set to which to add the value
 * @param {Value} value The value to add
 */
export function addItem(set, value) {
  set[value] = true
}

/**
 * Adds or removes a value from a set
 *
 * @template Value
 * @param {Set<Value>} set The set to/from which to add/remove the value
 * @param {Value} value The value to add/remove
 * @param {boolean} exists True if the value should be added, false if it should be removed
 */
export function toggleItem(set, value, exists) {
  const action = exists ? addItem : removeItem
  action(set, value)
}

/**
 * Checks whether a value is contained in a set
 *
 * @template Value
 * @param {Set<Value>} set The set to check whether the value is contained in
 * @param {Value} value The value to check
 * @returns {boolean} True if the value is contained in the set
 */
export function hasItem(set, value) {
  return set[value] === true
}

/**
 * Returns an array containing all values of a set
 *
 * @template Value
 * @param {Set<Value>} set The set to get the values from
 * @returns {string[]} The values of the set
 */
export function getItems(set) {
  return Object.keys(set)
}

/**
 * Checks whether a set is empty
 *
 * @template Value
 * @param {Set<Value>} set The set to check
 * @returns {boolean} True if the set contains no values
 */
export function isEmpty(set) {
  return _.isEmpty(set)
}

/**
 * Compares the values of two sets
 *
 * @template Value
 * @param {Set<Value>} setA A set
 * @param {Set<Value>} setB A different set
 * @returns {boolean} True if the two sets contain the same values
 */
export function isEqual(setA, setB) {
  return _.isEqual(setA, setB)
}
