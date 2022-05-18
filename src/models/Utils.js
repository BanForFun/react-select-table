import _ from 'lodash'
import * as stateModules from '../constants/stateModules'
import Actions from './Actions'
import Hooks from './Hooks'
import Events from './Events'
import { eventHandlersSymbol } from '../constants/symbols'

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
 * @property {ItemPredicate} [itemPredicate] Takes a row and the item filter, and returns true if the row should be visible
 * @property {ItemComparator} [itemComparator] Takes two rows and the property path based on which they should be compared, and returns: <li> 1, if first row is larger than the second <li> 0, if rows are equal <li> -1, if first row is smaller than the second <li> null, to fall back to the default lodash comparator
 * @property {SearchPhraseParser} [searchPhraseParser] Parses the search phrase typed by the user, and also the row property for it to be matched against.
 * @property {string} [searchProperty] The path of a row property that the search phrase is matched against
 * @property {boolean} [multiSelect] Allow multiple rows to be selected simultaneously
 * @property {boolean} [listBox] Retain selection when clicking in the space below the rows, and when right-clicking on another row
 * @property {string} [valueProperty] The path of a row property that has a unique value for each row (must be string or number)
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
  stateModules: stateModules.Filter | stateModules.Items | stateModules.Pagination | stateModules.SortOrder
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

  this.getItemValue = itemData =>
    _.get(itemData, options.valueProperty)

  this.doSaveModule = module =>
    (options.stateModules & module) === options.stateModules

  this.getSaveState = state => {
    const save = { initialState: {} }

    const saveProperties = (...names) => {
      for (const name of names)
        save.initialState[name] = state[name]
    }

    if (this.doSaveModule(stateModules.Filter))
      saveProperties('filter')

    if (this.doSaveModule(stateModules.SortOrder))
      saveProperties('sortAscending')

    if (this.doSaveModule(stateModules.Items)) {
      saveProperties('isLoading', 'error')
      save.items = _.map(state.sortedItems, item => item.data)
    }

    if (this.doSaveModule(stateModules.Pagination))
      saveProperties('pageSize')

    if (this.doSaveModule(stateModules.Search)) {
      saveProperties('searchPhrase')

      if (this.doSaveModule(stateModules.Items | stateModules.Filter | stateModules.SortOrder))
        saveProperties('matchIndex')
    }

    if (this.doSaveModule(stateModules.Selection)) {
      save.selection = Object.keys(state.selected)
      saveProperties('activeIndex', 'pivotIndex')
    }

    return save
  }

  this[eventHandlersSymbol] = {}
  this.actions = new Actions(namespace)
  this.hooks = new Hooks(this)
  this.events = new Events(this)
}
