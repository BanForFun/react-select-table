import _ from 'lodash'
import * as saveModules from '../constants/saveModules'
import * as flagUtils from '../utils/flagUtils'
import * as dlMapUtils from '../utils/doublyLinkedMapUtils'
import * as setUtils from '../utils/setUtils'

const moduleProperties = {
  [saveModules.Items]: ['isLoading', 'error', 'items'],
  [saveModules.Selection]: 'selected',
  [saveModules.Filter]: 'filter',
  [saveModules.SortOrder]: 'sortAscending',
  [saveModules.Pagination]: 'pageSize',
  [saveModules.Active]: 'activeIndex',
  [saveModules.Pivot]: 'pivotIndex',
  [saveModules.Search]: 'searchPhrase'
}

/**
 * @typedef {import('../store/store').State} State
 */

/**
 * @typedef {import('../store/store').RowKey} RowKey
 */

export default class Selectors {
  constructor(options) {
    /** @private */
    this.options = options
  }

  /**
   * Returns the slice of the state that belongs to the table
   *
   * @param {object} state The whole redux state
   * @returns {State} The table's state
   */
  getTableState = state =>
    this.options.statePath ? _.get(state, this.options.statePath) : state

  /**
   * Returns the page size if pagination is enabled, or the total count of items if it is disabled
   *
   * @param {State} state The table's state
   * @returns {number} The maximum number of rows than can be visible at once
   */
  getPageSize = (state) =>
    state.pageSize || state.visibleItemCount

  /**
   * Returns the number of pages based on the page size
   *
   * @param {State} state The table's state
   * @returns {number} The number of pages
   */
  getPageCount = (state) =>
    Math.ceil(state.visibleItemCount / this.getPageSize(state))

  /**
   * Returns the index of the page that a row is in
   *
   * @param {State} state The table's state
   * @param {number} itemIndex A row index
   * @returns {number} The index of the page the row is in
   */
  getItemPageIndex = (state, itemIndex) =>
    Math.floor(itemIndex / this.getPageSize(state))

  /**
   * Returns the index of the currently selected page
   *
   * @param {State} state The table's state
   * @returns {number} The index of the current page
   */
  getPageIndex = (state) =>
    this.getItemPageIndex(state, state.activeIndex)

  /**
   * Returns the index of the top most visible row on the current page, relative to the first row of the first page
   *
   * @param {State} state The table's state
   * @returns {number} The index of the first visible row
   */
  getPageIndexOffset = (state) =>
    this.getPageIndex(state) * state.pageSize

  /**
   * Returns a serializable subset of the table's state, which can be passed to {@link Options.savedState}
   * to restore the table to the present state
   *
   * @param {State} state The table's state
   * @param {number} modules {@link https://docs.revenera.com/installshield19helplib/helplibrary/BitFlags.htm|Bit flags}
   * (exported as saveModules) that control which parts of the state to save
   * @returns {object} A part of the table's state
   */
  getSaveState = (state, modules) => {
    const saveState = {}
    for (const module in moduleProperties) {
      if (!flagUtils.hasFlag(modules, parseInt(module))) continue
      Object.assign(saveState, _.pick(state, moduleProperties[module]))
    }

    // Parse items
    if (saveState.items)
      saveState.items = dlMapUtils.getItems(saveState.items)

    // Parse selection
    if (saveState.selected)
      saveState.selected = setUtils.getItems(saveState.selected)

    return saveState
  }

  /**
   * Returns the index of the active row in the current page
   *
   * @param {State} state The table's state
   * @returns {number} The index of the active row
   */
  getActiveRowIndex = (state) =>
    state.activeIndex % this.getPageSize(state)

  /**
   * Returns the key of the active row
   *
   * @param {State} state The table's state
   * @returns {RowKey} The key of the active row
   */
  getActiveKey = (state) =>
    state.rowKeys[this.getActiveRowIndex(state)]

  /**
   * Returns whether a row is selected
   *
   * @param {State} state The table's state
   * @param {number} rowIndex The index of the row in the current page
   * @returns {boolean} Whether the row is selected
   */
  getSelected = (state, rowIndex) =>
    setUtils.hasItem(state.selected, state.rowKeys[rowIndex])

  /**
   * Returns the value to be passed to event handlers that take the current selection as an argument
   *
   * @param {State} state The table's state
   * @returns {import('./Events').SelectionArg} See {@link Events.SelectionArg}
   */
  getSelectionArg = (state) => {
    const selectedKeys = setUtils.getItems(state.selected)
    if (this.options.multiSelect)
      return new Set(selectedKeys)

    return selectedKeys[0] ?? null
  }

  /**
   * Returns the argument to be passed to the onContextMenu event handler
   *
   * @param {State} state The table's state
   * @param {boolean} [forceEmpty=false] Return an argument that reflects an empty selection, even if it isn't
   * @param {boolean} [forceSelection=false] Always return the selected keys, even in listBox mode
   * @returns {import('./Events').ContextMenuArg}
   * When {@link Options.listBox} is false or forceSelection is true, it is the same as {@link Events.SelectionArg}.
   *
   * In all other cases the key of the active row is returned: As is when {@link Options.multiSelect} is false,
   * or in a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set|Set}
   * when Options.multiSelect is true.
   */
  getContextMenuArg = (state, forceEmpty = false, forceSelection = false) => {
    const { listBox, multiSelect } = this.options

    const activeKey = this.getActiveKey(state)
    if (forceEmpty || activeKey == null)
      return multiSelect ? new Set() : null

    if (forceSelection || !listBox)
      return this.getSelectionArg(state)

    return multiSelect ? new Set([activeKey]) : activeKey
  }
}
