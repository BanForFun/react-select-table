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
 * @function ItemPredicate
 * @param {object} row The row in question
 * @param {*} filter The item filter
 * @returns {boolean} True if the row should be visible, false otherwise
 * @see actions.setItemFilter
 */

/**
 * @function ItemComparator
 * @param {*} lhs The property of the left-hand side row
 * @param {*} rhs The property of the right-hand side row
 * @param {string} path The column's path
 * @returns {?number} 1: lhs > rhs, 0: lhs == rhs, -1: lhs < rhs, null: Fallback to default comparator
 */

/**
 * @function SearchPhraseParser
 * @param {string} phrase The search phrase, directly as typed by the user
 * @returns {string} The modified search phrase to be compared to the row property
 * @see actions.search
 */

/**
 * The table options
 *
 * @typedef {object} Options
 * @property {ItemPredicate} itemPredicate Decides whether a row should be visible based on the filter.
 * @property {ItemComparator} itemComparator Compares two rows based on their property at the sorting column's {@link Column.path}.
 * @property {SearchPhraseParser} searchPhraseParser Parses the search phrase before matching it to the start of the rows' property at {@link Options.searchProperty}.
 * @property {string} searchProperty The path of a row property that the search phrase is matched against
 * @property {boolean} multiSelect Allow multiple rows to be selected simultaneously
 * @property {boolean} listBox Retain selection when clicking in the space below the rows, and when right-clicking on another row
 * @property {string} valueProperty The path of a row property that 1. has a unique value for each row, and 2. is of type NUMBER OR STRING
 * @property {boolean} constantWidth When resizing a column, shrink the next one by the same amount, keeping the total width constant
 * @property {number} minColumnWidth The minimum width in pixels allowed for a column:
 * 1. When resizing it, and 2. Before a scrollbar appears when shrinking the container
 * @property {number} chunkSize The maximum number of rows per chunk. A chunk is a collection of rows that is not rendered when not in view.
 * A big chunk size improves scrolling performance at the cost of column resizing performance.
 * Must be a multiple of 2 to preserve the stripped row pattern.
 * Note: Resizing a column only updates the current chunk, making scrolling using the scrollbar jerky when
 * chunks load in for the first time after resizing a column.
 * @property {string} statePath The path of the redux table state. Set to null if the table reducer is the root.
 * @property {object} initState The initial redux state, useful for restoring a user's session
 * @property {React.Context} context If you use a custom context for your Provider, you can pass it here
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

  const getTableState = state =>
    options.statePath ? _.get(state, options.statePath) : state

  const actions = new Actions(namespace)
  const hooks = new Hooks(options, actions, getTableState)

  const eventHandlers = { }
  const events = new Events(options, eventHandlers)

  return (tableUtils[namespace] = {
    eventHandlers,
    public: {
      actions,
      hooks,
      options,
      events,
      getTableState
    }
  })
}

export function getTableUtils(namespace) {
  return tableUtils[namespace].public
}
