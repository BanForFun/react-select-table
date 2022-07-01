import _ from 'lodash'

/**
 * @callback itemPredicate
 * @param {object} row
 * @param {*} filter
 * @returns {boolean}
 */

/**
 * @callback itemComparator
 * @param {*} left
 * @param {*} right
 * @param {string} key
 * @returns {?number}
 */

/**
 * @callback searchPhraseParser
 * @param {string} phrase
 * @returns {string}
 */

const defaultOptions = {
  itemPredicate: _.isMatch,
  itemComparator: () => null,
  searchPhraseParser: phrase => phrase.normalize('NFD').toLowerCase(),
  searchProperty: null,
  multiSelect: true,
  listBox: false,
  minColumnWidth: 50,
  statePath: null,
  savedState: null,
  context: undefined,
  keyBy: '_id'
}

/**
 * The table options
 *
 * @typedef {object} Options
 * @property {itemPredicate} [itemPredicate] Takes a row and the item filter, and must return true if the row should be visible
 * @property {itemComparator} [itemComparator] Takes the value of a property of two rows, and the path of that property, and must return: <ul><li>1, if first is larger than the second</li> <li>0, if values are equal</li> <li>-1, if first is smaller than the second</li> <li>null, to fall back to the default lodash comparator</li></ul>
 * @property {searchPhraseParser} [searchPhraseParser] Takes the search phrase typed in by the user, or the value of the {@link searchProperty} of a row. The returned values are compared to each other
 * @property {string} [searchProperty] The path of a row property for the search phrase to be matched against
 * @property {boolean} [multiSelect] Allow multiple rows to be selected simultaneously
 * @property {boolean} [listBox] Retain selection when clicking in the space below the rows, and when right-clicking on another row
 * @property {string | Function} [keyBy] The path of a row property that has a unique value for each row, or a function that takes a row as an argument and returns a value unique to that row. In either case, the unique value must be a string or a number
 * @property {boolean} [constantWidth] When resizing a column, shrink the next one by the same amount, keeping the total width constant
 * @property {number} [minColumnWidth] The minimum width in pixels allowed for a column when resizing it, and before a scrollbar appears when resizing the container.
 * @property {string} [statePath] The path of the redux table state. Set to null if the table reducer is the root.
 * @property {object} [savedState] Load from a previously saved state, useful for restoring a user's session
 * @property {import("react").Context} [context] If you use a custom context for your Provider, you can pass it here
 */

/**
 * @param {Options} options The options to override the defaults
 * @returns {Options} The complete set of options
 */
export function getOptions(options) {
  return Object.freeze(_.defaults(options, defaultOptions))
}

/**
 * Modified the default table options
 *
 * @param {Options} options The options to change
 */
export function setDefaultOptions(options) {
  Object.assign(defaultOptions, options)
}
