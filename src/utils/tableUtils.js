import _ from 'lodash'
import Hooks from '../models/Hooks'
import Actions from '../models/Actions'
import Events from '../models/Events'
import React from 'react'

export const DragModes = Object.freeze({
  Resize: 'resize',
  Select: 'select'
})

export const GestureTargets = Object.freeze({
  Header: -2,
  BelowItems: -1
})

export const px = n => `${n}px`
export const pc = n => `${n}%`

export const tableUtils = {}

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
 * @property {object} [initState] The initial redux state, useful for restoring a user's session
 * @property {React.Context} [context] If you use a custom context for your Provider, you can pass it here
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
  initState: {},
  context: undefined
}

/**
 * Applies a patch the default options, that will be used by all future tables created using createTable
 *
 * @param {Options} optionsPatch The new default options
 */
export function setDefaultTableOptions(optionsPatch) {
  Object.assign(defaultOptions, optionsPatch)
}

// Internal
export function setOptions(namespace, options) {
  Object.freeze(_.defaults(options, defaultOptions))

  const utils = {
    getTableState: state =>
      options.statePath ? _.get(state, options.statePath) : state,

    getItemValue: itemData =>
      _.get(itemData, options.valueProperty)
  }

  const actions = new Actions(namespace)
  const hooks = new Hooks(options, actions, utils)

  const eventHandlers = { }
  const events = new Events(options, eventHandlers, utils)

  return (tableUtils[namespace] = {
    eventHandlers,
    public: {
      actions,
      hooks,
      options,
      events,
      ...utils
    }
  })
}

export function getTableUtils(namespace) {
  return tableUtils[namespace].public
}
