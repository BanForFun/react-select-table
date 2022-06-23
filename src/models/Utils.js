import _ from 'lodash'
import * as loadModules from '../constants/loadModules'
import Actions from './Actions'
import Hooks from './Hooks'
import Events from './Events'

/**
 * @callback ItemPredicate
 * @param {object} row
 * @param {*} filter
 * @returns {boolean}
 */

/**
 * @callback ItemComparator
 * @param {*} first
 * @param {*} second
 * @param {string} path
 * @returns {?number}
 */

/**
 * @callback SearchPhraseParser
 * @param {string} phrase
 * @returns {string}
 */

/**
 * The table options
 *
 * @typedef {object} Options
 * @property {ItemPredicate} [itemPredicate] Takes a row and the item filter, and must return true if the row should be visible
 * @property {ItemComparator} [itemComparator] Takes the value of a property of two rows, and the path of that property, and must return: <ul><li>1, if first is larger than the second</li> <li>0, if values are equal</li> <li>-1, if first is smaller than the second</li> <li>null, to fall back to the default lodash comparator</li></ul>
 * @property {SearchPhraseParser} [searchPhraseParser] Takes the search phrase typed in by the user, or the value of the {@link searchProperty} of a row. The returned values are compared to each other
 * @property {string} [searchProperty] The path of a row property for the search phrase to be matched against
 * @property {boolean} [multiSelect] Allow multiple rows to be selected simultaneously
 * @property {boolean} [listBox] Retain selection when clicking in the space below the rows, and when right-clicking on another row
 * @property {string | Function} [keyBy] The path of a row property that has a unique value for each row, or a function that takes a row as an argument and returns a value unique to that row. In either case, the unique value must be a string or a number
 * @property {boolean} [constantWidth] When resizing a column, shrink the next one by the same amount, keeping the total width constant
 * @property {number} [minColumnWidth] The minimum width in pixels allowed for a column when resizing it, and before a scrollbar appears when resizing the container.
 * @property {number} [chunkSize] The maximum number of rows per chunk. A chunk is a collection of rows that is not rendered when not in view. A big chunk size improves scrolling performance at the cost of column resizing performance. Must be a multiple of 2 to preserve the stripped row pattern. Note: Resizing a column only updates the current chunk, making scrolling using the scrollbar jerky when chunks load in for the first time after resizing a column.
 * @property {string} [statePath] The path of the redux table state. Set to null if the table reducer is the root.
 * @property {object} [savedState] Load from a previously saved state, useful for restoring a user's session
 * @property {number} [stateModules] Binary flags to control which parts of the state to save and restore
 * @property {import("react").Context} [context] If you use a custom context for your Provider, you can pass it here
 */

const defaultOptions = {
  itemPredicate: _.isMatch,
  itemComparator: () => null,
  searchPhraseParser: phrase => phrase.normalize('NFD').toLowerCase(),
  searchProperty: null,
  multiSelect: true,
  listBox: false,
  minColumnWidth: 50,
  chunkSize: 100,
  statePath: null,
  savedState: {},
  context: undefined,
  loadModules: loadModules.Filter | loadModules.Items | loadModules.Pagination | loadModules.SortOrder,
  keyBy: '_id'
}

/**
 * Applies a patch the default options, that will be used by all future tables created using createTable
 *
 * @param {Options} optionsPatch The new default options
 */
export function setDefaultTableOptions(optionsPatch) {
  Object.assign(defaultOptions, optionsPatch)
}

/**
 * @param {string} namespace The reducer namespace
 * @param {Options} options The reducer options
 * @class
 */
export default function Utils(namespace, options) {
  this.options = Object.freeze(_.defaults(options, defaultOptions))

  this.getTableState = state =>
    options.statePath ? _.get(state, options.statePath) : state

  this.shouldLoadModule = module =>
    (options.stateModules & module) === options.stateModules

  this.actions = new Actions(namespace)
  this.hooks = new Hooks(this)
  this.events = new Events(this)
}
