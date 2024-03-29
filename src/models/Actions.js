import { bindPrototypeMethods } from '../utils/classUtils'
import types from '../constants/actionTypes'
import { SortOrders } from '../constants/enums'

/**
 * @class Actions
 */
export default class Actions {
  /**
   * @param {string} namespace The namespace passed to {@link createTable}
   */
  constructor(namespace) {
    bindPrototypeMethods(this)

    /**
     * @param {string} type The action type
     * @param {object} [payload] The action payload
     * @returns {ActionsTypes.Action} The complete action, including the namespace
     * @private
     */
    this.getAction = (type, payload = null) =>
      ({ namespace, type, payload })
  }

  /**
   * Brings up the search menu and highlights the first match.
   *
   * @param {string} phrase The text that is passed to {@link Options.searchPhraseParser}.
   * @returns {ActionsTypes.Action} The redux action object
   */
  search(phrase) {
    return this.getAction(types.SEARCH, { phrase })
  }

  /**
   * Jumps to a specific search match.
   *
   * @param {number} index The index of the match to jump to,
   * wrapped to the count of matches ex. -1 would be the last match.
   * @returns {ActionsTypes.Action} The redux action object
   */
  goToMatch(index) {
    return this.getAction(types.GO_TO_MATCH, { index })
  }

  /**
   * Changes the page size.
   *
   * @param {number} size The maximum amount of rows per page. A size of 0 disables pagination.
   * @returns {ActionsTypes.Action} The redux action object
   */
  setPageSize(size) {
    return this.getAction(types.SET_PAGE_SIZE, { size })
  }

  /**
   * Removes all items, clears the selection and error, and resets the loading state.
   *
   * @returns {ActionsTypes.Action} The redux action object
   */
  clearItems() {
    return this.getAction(types.CLEAR_ITEMS)
  }

  /**
   * Hides the rows that don't match the filter and clears selection.
   *
   * @param {object} filter Passed to {@link Options.itemPredicate} along with every row
   * @returns {ActionsTypes.Action} The redux action object
   */
  setItemFilter(filter) {
    return this.getAction(types.SET_ITEM_FILTER, { filter })
  }

  /**
   * Applies a deep patch to rows.
   *
   * @param {...object} patches Every property of each object,
   * will be applied to the row with the same {@link StoreTypes.RowKey|key}
   * @returns {ActionsTypes.Action} The redux action object
   */
  patchItems(...patches) {
    return this.getAction(types.PATCH_ITEMS, { patches })
  }

  /**
   * Applies a deep patch to rows by key.
   *
   * @param {Object<RowKeyType, object>} patchMap For every key of this object,
   * the row with the same key will be found, and the properties of the corresponding value will be applied to it
   * @returns {ActionsTypes.Action} The redux action object
   */
  patchItemsByKey(patchMap) {
    return this.getAction(types.PATCH_ITEMS_BY_KEY, { patchMap })
  }

  /**
   * Deletes rows and deselects them.
   *
   * @param {...RowKeyType} keys The keys of the rows to be deleted
   * @returns {ActionsTypes.Action} The redux action object
   */
  deleteItems(...keys) {
    return this.getAction(types.DELETE_ITEMS, { keys })
  }

  /**
   * Adds rows, and selects them, or only the last one if {@link Options.multiSelect} is off.
   *
   * @param {...object} items The rows to be added
   * @returns {ActionsTypes.Action} The redux action object
   */
  addItems(...items) {
    return this.getAction(types.ADD_ITEMS, { items })
  }

  /**
   * Replaces the old rows, clears the selection and error, and resets the loading state.
   *
   * @param {object[]} items The new rows
   * @returns {ActionsTypes.Action} The redux action object
   */
  setItems(items) {
    return this.getAction(types.SET_ITEMS, { items })
  }

  /**
   * Replaces the old rows retaining the selection, clears the error, and resets the loading state.
   *
   * @param {object[]} items The new rows
   * @returns {ActionsTypes.Action} The redux action object
   */
  replaceItems(items) {
    return this.getAction(types.REPLACE_ITEMS, { items })
  }

  /**
   * Sorts the rows by the property at the given path in ascending order,
   * and toggles the order on subsequent calls
   *
   * @param {string} path The path of the property to sort by
   * @param {boolean} [addToPrev] Use the property to only sort the rows that are considered equal,
   * based on the current columns
   * @param {?boolean|string} [order] True to sort by ascending order, false for descending, null for none, 'toggle' to toggle
   * @returns {ActionsTypes.Action} The redux action object
   */
  sortItems(path, addToPrev = false, order = SortOrders.Toggle) {
    return this.getAction(types.SORT_ITEMS, { path, addToPrev, order })
  }

  /**
   * Selects a row or a range of rows. Selected rows have a green background with the default theme.
   *
   * @param {number} index The index of the row to select, in relation to the first row of the first page
   * @param {boolean} [isRange] Select all rows in between the latest selected row and this one
   * @param {boolean} [addToPrev] Keep the previously selected rows selected
   * @returns {ActionsTypes.Action} The redux action object
   */
  select(index, isRange = false, addToPrev = false) {
    return this.getAction(types.SELECT, { index, addToPrev, isRange })
  }

  /**
   * Deselects all rows.
   *
   * @returns {ActionsTypes.Action} The redux action object
   */
  clearSelection() {
    return this.getAction(types.CLEAR_SELECTION)
  }

  /**
   * Sets the active row. The active row has a dark green underline with the default theme,
   * and is used as a cursor for controlling the selection with the keyboard.
   * If the user is on a different page than the one that the active row is in, they are taken to it.
   * If the active row isn't visible, the table is scrolled to ensure that it is.
   *
   * @param {number} index The index of the row to be set active, in relation to the first row of the first page
   * @returns {ActionsTypes.Action} The redux action object
   */
  setActive(index) {
    return this.getAction(types.SET_ACTIVE, { index })
  }

  /**
   * Selects all rows.
   *
   * @returns {ActionsTypes.Action} The redux action object
   */
  selectAll() {
    return this.getAction(types.SELECT_ALL)
  }

  /**
   * Sets specific rows as selected or not
   *
   * @param {Object<number,boolean>} map An object with row indices as keys,
   * and the new selection statuses as values
   * @param {?number} [activeIndex] The index of the row to be set active, or null to leave unchanged
   * @param {?number} [pivotIndex] The index of the row to be set as the pivot
   * for selecting a range of rows using the keyboard, or null to leave unchanged
   * @returns {ActionsTypes.Action} The redux action object
   */
  setSelected(map, activeIndex = null, pivotIndex = null) {
    return this.getAction(types.SET_SELECTED, { map, activeIndex, pivotIndex })
  }

  /**
   * Displays an error message instead of the rows if truthy,
   * until {@link setItems} or {@link clearItems}
   *
   * @param {*} error Set as the child of {@link TableProps.errorComponent}
   * @returns {ActionsTypes.Action} The redux action object
   */
  setError(error) {
    return this.getAction(types.SET_ERROR, { error })
  }

  /**
   * Displays the {@link TableProps.loadingIndicator} instead of the rows,
   * until {@link setItems}, {@link clearItems} or {@link setError}.
   *
   * @returns {ActionsTypes.Action} The redux action object
   */
  startLoading() {
    return this.getAction(types.START_LOADING)
  }
}

/**
 * @namespace ActionsTypes
 */

/**
 * @typedef {Actions} ActionsTypes.ActionsClass
 */

/**
 * A table action
 *
 * @typedef {object} ActionsTypes.Action
 * @property {string} type The redux action type
 * @property {object} payload The action's payload
 * @property {string} namespace The namespace of the table that the action targets
 */

/**
 * @typedef {import('../store/store').StoreTypes.RowKey} RowKeyType
 */
