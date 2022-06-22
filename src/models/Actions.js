import _ from 'lodash'

export const types = {
  // Items
  SET_ITEMS: '',
  ADD_ITEMS: '',
  DELETE_ITEMS: '',
  PATCH_ITEMS: '',
  CLEAR_ITEMS: '',
  SORT_ITEMS: '',
  SET_ITEM_FILTER: '',

  // Displaying
  SET_ERROR: '',
  START_LOADING: '',

  // Selection
  SET_SELECTED: '',
  SELECT: '',
  CLEAR_SELECTION: '',
  SELECT_ALL: '',
  SET_ACTIVE: '',

  // Search
  SEARCH: '',
  GO_TO_MATCH: '',

  // Pagination
  SET_PAGE_SIZE: '',

  DEBUG: ''
}

// Set action type strings
Object.freeze(_.each(types, (type, name) => (types[name] = `RST_${name}`)))

/**
 * A table action
 *
 * @typedef {object} Action
 * @property {string} type The redux action type
 * @property {object} payload The action's payload
 * @property {string} namespace The namespace of the table that the action targets
 * @property {boolean} clearSearch Clear the search phrase and hide the search dialog as a result of this action
 */

/**
 * @class Actions
 * @param {string} namespace The namespace passed to {@link createTable}
 */
export default function Actions(namespace) {
  const getAction = (type, payload = {}) => ({ namespace, type, payload })

  this.debug = () => getAction(types.DEBUG)

  /**
   * Brings up the search menu and highlights the first match.
   *
   * @param {string} phrase The text that is passed to {@link Options.searchPhraseParser}.
   * @returns {Action} The redux action object
   */
  this.search = (phrase) =>
    getAction(types.SEARCH, { phrase })

  /**
   * Jumps to a specific search match.
   *
   * @param {number} index The index of the match to jump to,
   * wrapped to the count of matches ex. -1 would be the last match.
   * @returns {Action} The redux action object
   */
  this.goToMatch = (index) =>
    getAction(types.GO_TO_MATCH, { index })

  /**
   * Changes the page size.
   *
   * @param {number} size The maximum amount of rows per page. A size of 0 disables pagination.
   * @returns {Action} The redux action object
   */
  this.setPageSize = (size) =>
    getAction(types.SET_PAGE_SIZE, { size })

  /**
   * Removes all items, clears the selection and error, and resets the loading state.
   *
   * @returns {Action} The redux action object
   */
  this.clearItems = () =>
    getAction(types.CLEAR_ITEMS)

  /**
   * Hides the rows that don't match the filter and clears selection.
   *
   * @param {object} filter Passed to {@link Options.itemPredicate} along with every row
   * @returns {Action} The redux action object
   */
  this.setItemFilter = (filter) =>
    getAction(types.SET_ITEM_FILTER, { filter })

  /**
   * Applies a deep patch to rows.
   *
   * @param {...object} patches Every property each object contains,
   * will be applied to the row with the same {@link RowKey|value}
   * @returns {Action} The redux action object
   */
  this.patchItems = (...patches) =>
    getAction(types.PATCH_ITEMS, { patches })

  // TODO: Add patchItemsByKey

  /**
   * Deletes rows and deselects them.
   *
   * @param {...*} keys The {@link RowKey|keys} of the rows to be deleted
   * @returns {Action} The redux action object
   */
  this.deleteItems = (...keys) =>
    getAction(types.DELETE_ITEMS, { keys })

  /**
   * Adds rows, and selects them, or only the last one if {@link Options.multiSelect} is off.
   *
   * @param {...object} items The rows to be added
   * @returns {Action} The redux action object
   */
  this.addItems = (...items) =>
    getAction(types.ADD_ITEMS, { items })

  /**
   * Replaces the old rows, clears the selection and error, and resets the loading state.
   *
   * @param {object[]} items The new rows
   * @returns {Action} The redux action object
   */
  this.setItems = (items) =>
    getAction(types.SET_ITEMS, { items })

  /**
   * Sorts the rows by the property at the given path in ascending order,
   * and toggles the order on subsequent calls
   *
   * @param {string} path The path of the property to sort by
   * @param {boolean} addToPrev Sort items that have equal values in the previous sorting columns,
   * by a secondary property
   * @returns {Action} The redux action object
   */
  this.sortItems = (path, addToPrev = false) =>
    getAction(types.SORT_ITEMS, {
      path,
      addToPrev
    })

  /**
   * Selects a row or a range of rows. Selected rows have a green background with the default theme.
   *
   * @param {number} index The index of the row to select, in relation to the first row of the first page
   * @param {boolean} isRange Select all rows in between the latest selected row and this one
   * @param {boolean} addToPrev Keep the previously selected rows selected
   * @param {boolean} contextMenu Call {@link TableProps.onContextMenu} when done, with the updated selection
   * @returns {Action} The redux action object
   */
  this.select = (index, isRange = false, addToPrev = false, contextMenu = false) =>
    getAction(types.SELECT, {
      index,
      addToPrev,
      isRange,
      contextMenu
    })

  /**
   * Deselects all rows.
   *
   * @param {boolean} contextMenu Call {@link TableProps.onContextMenu} when done
   * @returns {Action} The redux action object
   */
  this.clearSelection = (contextMenu = false) =>
    getAction(types.CLEAR_SELECTION, { contextMenu })

  /**
   * Sets the active row. The active row has a dark green underline with the default theme,
   * and is used as a cursor for controlling the selection with the keyboard.
   * If the user is on a different page than the one that the active row is in, they are taken to it.
   * If the active row isn't visible, the table is scrolled to ensure that it is.
   *
   * @param {number} index The index of the row to be set active, in relation to the first row of the first page
   * @param {boolean} contextMenu Call {@link TableProps.onContextMenu} when done
   * @returns {Action} The redux action object
   */
  this.setActive = (index, contextMenu = false) =>
    getAction(types.SET_ACTIVE, {
      index,
      contextMenu
    })

  /**
   * Selects all rows.
   *
   * @returns {Action} The redux action object
   */
  this.selectAll = () =>
    getAction(types.SELECT_ALL)

  /**
   * Sets specific rows as selected or not
   *
   * @param {Object<number,boolean>} map An object with row indices as keys,
   * and the new selection statuses as values
   * @param {?number} activeIndex The index of the row to be set active, or null to leave unchanged
   * @param {?number} pivotIndex The index of the row to be set as the pivot
   * for selecting a range of rows using the keyboard, or null to leave unchanged
   * @returns {Action} The redux action object
   */
  this.setSelected = (map, activeIndex = null, pivotIndex = null) =>
    getAction(types.SET_SELECTED, {
      map,
      activeIndex,
      pivotIndex
    })

  /**
   * Displays an error message instead of the rows if truthy,
   * until {@link setItems} or {@link clearItems}
   *
   * @param {*} error Set as the child of {@link TableProps.errorComponent}
   * @returns {Action} The redux action object
   */
  this.setError = (error) =>
    getAction(types.SET_ERROR, { error })

  /**
   * Displays the {@link TableProps.loadingIndicator} instead of the rows,
   * until {@link setItems}, {@link clearItems} or {@link setError}.
   *
   * @returns {Action} The redux action object
   */
  this.startLoading = () =>
    getAction(types.START_LOADING)
}
