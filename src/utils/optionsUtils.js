import _ from 'lodash'

/**
 * @callback ItemPredicate
 * @param {object} row
 * @param {*} filter
 * @returns {boolean}
 */

/**
 * @callback ItemComparator
 * @param {object} left
 * @param {object} right
 * @param {string} key
 * @returns {number|void}
 */

/**
 * @callback SearchPhraseParser
 * @param {string} phrase
 * @returns {string}
 */

const defaultOptions = {
  itemPredicate: _.isMatch,
  itemComparator: () => {},
  searchPhraseParser: phrase => phrase.normalize('NFD').toLowerCase(),
  searchProperty: '',
  multiSelect: true,
  listBox: false,
  minColumnWidth: 50,
  constantWidth: false,
  statePath: '',
  savedState: {},
  context: undefined,
  keyBy: '_id'
}

/**
 * The table options
 *
 * @typedef {object} Options
 * @property {ItemPredicate} itemPredicate Takes a row and the item filter, and must return true if the row should be visible
 * @property {ItemComparator} itemComparator Takes the value of a property of two rows, and the path of that property, and must return: <ul><li>1, If the first is larger than the second</li> <li>0, If the values are equal</li> <li>-1, If the first is smaller than the second</li> <li>undefined, to fall back to the default lodash comparator</li></ul>
 * @property {SearchPhraseParser} searchPhraseParser Takes the search phrase typed in by the user, or the value of the {@link searchProperty} of a row. The returned values are compared to each other
 * @property {string} searchProperty The path of a row property for the search phrase to be matched against. Set to empty string to disable searching
 * @property {boolean} multiSelect Allow multiple rows to be selected simultaneously
 * @property {boolean} listBox Retain selection when clicking in the space below the rows, and when right-clicking on another row
 * @property {string | function(object):string|number} keyBy The path of a row property that has a unique value for each row, or a function that takes a row as an argument and returns a value unique to that row. In either case, the unique value must be a string or a number
 * @property {boolean} constantWidth When resizing a column, shrink the next one by the same amount, keeping the total width constant
 * @property {number} minColumnWidth The minimum width in pixels allowed for a column when resizing it, and before a scrollbar appears when resizing the container
 * @property {string} statePath The path of the redux table state. Set to empty string if the table reducer is the root
 * @property {object} savedState Load from a previously saved state, used for restoring a user's session. Takes an object returned from {@link Selectors.getSaveState}
 * @property {import("react").Context} context If you use a custom context for your Provider, you can pass it here
 */

/**
 * @param {Partial<Options>} options The options to override the defaults
 * @returns {Options} The complete set of options
 */
export function getOptions(options) {
  return Object.freeze(_.defaults(options, defaultOptions))
}

/**
 * Modifies the default table options
 *
 * @param {Partial<Options>} options The options to change
 */
export function setDefaultOptions(options) {
  Object.assign(defaultOptions, options)
}
