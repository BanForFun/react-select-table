import _ from 'lodash'
import produce from 'immer'
import { types } from '../models/Actions'
import { createTableUtils } from '../utils/tableUtils'
import { compareAscending } from '../utils/sortUtils'
import * as setUtils from '../utils/setUtils'
import * as selectors from '../selectors/selectors'
import storeSymbols from '../constants/storeSymbols'
import * as dlmapUtils from '../utils/doublyLinkedMapUtils'

const nextSortOrder = Object.freeze({
  undefined: true,
  true: false,
  false: undefined
})

const searchOrigins = Object.freeze({
  TableBoundary: 'table',
  PageBoundary: 'page',
  ActiveRow: 'active'
})

/**
 * The value of the property at {@link Options.valueProperty}
 *
 * @typedef {string|number} RowValue
 */

/**
 * @typedef {Object<string, SearchEntry>} SearchEntry
 * @property {RowValue[]} values The values of the rows that match
 */

/**
 * @typedef {object} ItemNode
 * @property {object} data The contents of the item
 * @property {RowValue} prev The value of the previous item
 * @property {RowValue} next The value of the next item
 * @property {boolean} visible True if the item should be rendered
 */

/**
 * @typedef {object} State
 * @property {Object<string, boolean>} selection An object with all the selected values as keys, and true as values
 * @property {*} filter The item filter
 * @property {Object<string, boolean>} sortAscending An object with property paths as keys, and true for ascending order or false for descending, as values
 * @property {boolean} isLoading When true, a loading indicator is displayed
 * @property {number} pageSize The maximum number of items in a page, 0 is pagination is disabled
 * @property {*} error When truthy, an error message is displayed
 * @property {SearchEntry} searchIndex A {@link https://en.wikipedia.org/wiki/Trie|trie} made from the value of {@link Options.searchProperty} of each row after being parsed by {@link Options.searchPhraseParser}
 * @property {string} searchPhrase The search phrase after being parsed by {@link Options.searchPhraseParser}
 * @property {RowValue[]} matches The values of the rows that matched the search phrase, sorted in the order they appear
 * @property {number} matchIndex The currently highlighted match index
 * @property {Object<string, ItemNode>} sortedItems A {@link https://en.wikipedia.org/wiki/Doubly_linked_list|doubly linked list} of all items, sorted based on {@link sortAscending}
 * @property {RowValue[]} rowValues The values of the items to be displayed, filtered and sorted
 * @property {number} visibleItemCount The number of nodes inside {@link sortedItems} with visible being true
 * @property {number} activeIndex The index of the active row inside {@link rowValues}
 * @property {number} pivotIndex The index of the pivot row inside {@link rowValues}
 */

/**
 * Takes the current state and an action, and returns the next state
 *
 * @callback Reducer
 * @param {State} state
 * @param {import("../models/Actions").Actions} action
 * @returns {State}
 */

/**
 * Returns a table reducer
 *
 * @param {string} namespace A unique identifier for the table reducer
 * @param {import('../models/Utils').Options} options The reducer options
 * @returns {Reducer} The table reducer
 */
export default function createTable(namespace, options = {}) {
  createTableUtils(namespace, options)

  const {
    valueProperty,
    searchProperty,
    savedState
  } = options

  const initState = {
    filter: null,
    sortAscending: {},
    isLoading: false,
    pageSize: 0,
    error: null,
    [storeSymbols.searchIndex]: {},
    searchPhrase: null,
    [storeSymbols.searchMatches]: [],
    [storeSymbols.searchMatchIndex]: 0,
    items: {},
    [storeSymbols.rowValues]: [],
    [storeSymbols.visibleItemCount]: 0,
    activeIndex: 0,
    pivotIndex: 0,
    selected: {},

    // resetPivot: false,

    ...savedState.initialState
  }

  let draft = initState
  const {
    getActiveValue,
    getActiveRowIndex,
    getPageCount,
    getPageIndex,
    getPageSize,
    getPageIndexOffset,
    getItemPageIndex
  } = _.mapValues(selectors, selector =>
    (state = draft, ...rest) => selector(state, ...rest))

  //#region Validation

  function isIndexValid(index) {
    return index != null && _.inRange(index, draft[storeSymbols.visibleItemCount])
  }

  function isValueValid(value, checkVisible = false) {
    if (value == null) return false

    const item = draft.items[value]
    if (!item) return false

    return !checkVisible || item[storeSymbols.itemVisible]
  }

  //#endregion

  //#region Visibility

  function setItemVisibility(value, visibility = null) {
    const item = draft.items[value]
    visibility ??= options.itemPredicate(item, draft.filter)

    if (!!item[storeSymbols.itemVisible] !== visibility) {
      item[storeSymbols.itemVisible] = visibility
      draft[storeSymbols.visibleItemCount] += visibility ? 1 : -1
    }

    return visibility
  }

  //#endregion

  //#region Sorting

  function compareItems(lhsValue, rhsValue) {
    const compareProperty = (comparator, path) => comparator(
      _.get(draft.items[lhsValue], path), _.get(draft.items[rhsValue], path), path
    )

    let factor = 1
    for (const path in draft.sortAscending) {
      factor = draft.sortAscending[path] ? 1 : -1

      const result = compareProperty(options.itemComparator, path) ?? compareProperty(compareAscending, path)
      if (result) return result * factor
    }

    // Ensure that reversing the sort order of a column with all equal values, reverses the item order
    return compareAscending(lhsValue, rhsValue) * factor
  }

  function sortItems() {
    dlmapUtils.sortItems(draft.items, compareItems)

    setActiveValue(null)
    clearSelection()
  }

  //#endregion

  //#region Querying

  function * valueIterator(onlyVisible = false, forward = undefined, originValue = undefined) {
    const iterator = dlmapUtils.valueIterator(draft.items, forward, originValue)
    for (const value of iterator) {
      const item = draft.items[value]
      if (onlyVisible && !item[storeSymbols.itemVisible]) continue

      yield value
    }
  }

  //#endregion

  //#region Pagination

  const getPageBoundary = forward =>
    forward ? getPageSize() - 1 : 0

  const resolveSearchOrigin = (origin, forward) => {
    let rowIndex
    switch (origin) {
      case searchOrigins.PageBoundary:
        rowIndex = getPageBoundary(forward)
        break
      case searchOrigins.ActiveRow:
        rowIndex = getActiveRowIndex()
        break
      default: return {
        index: forward ? 0 : draft[storeSymbols.visibleItemCount] - 1,
        value: undefined,
        isVisible: false
      }
    }

    return {
      index: rowIndex + getPageIndexOffset(),
      value: draft[storeSymbols.rowValues][rowIndex],
      isVisible: true
    }
  }

  function setActiveItem(callback, searchForward, searchOrigin) {
    const pageBoundary = getPageBoundary(searchForward)
    const pageSize = getPageSize()
    const origin = resolveSearchOrigin(searchOrigin, searchForward)
    let rowValues = origin.isVisible ? draft[storeSymbols.rowValues] : []

    let setActive = null
    let { index } = origin

    const values = valueIterator(true, searchForward, origin.value)
    for (const value of values) {
      const rowIndex = index % pageSize
      rowValues[rowIndex] = value

      const isOrigin = origin.isVisible && value === origin.value
      if (!isOrigin && callback({ value, index })) {
        setActive ??= index
        if (rowValues === draft.rowValues) break
      }

      index += searchForward ? 1 : -1
      if (rowIndex !== pageBoundary) continue
      if (setActive != null) break

      rowValues = []
    }

    if (setActive != null) {
      draft.activeIndex = setActive
      draft[storeSymbols.rowValues] = rowValues
    }

    return setActive
  }

  function setActiveValue(value, searchForward = true, searchOrigin = searchOrigins.TableBoundary) {
    const callback = isValueValid(value, true)
      ? item => item.value.toString() === value.toString()
      : () => true
    return setActiveItem(callback, searchForward, searchOrigin)
  }

  function setActiveIndex(index, pageInvalid = false) {
    if (!isIndexValid(index)) return false

    const currentPage = pageInvalid ? NaN : getPageIndex()
    const targetPage = getItemPageIndex(draft, index)
    if (currentPage === targetPage) {
      draft.activeIndex = index
      return getActiveValue(draft)
    }

    const afterCurrent = targetPage > currentPage
    const origins = [
      { page: currentPage, forward: afterCurrent, row: searchOrigins.PageBoundary },
      { page: 0, forward: true, row: searchOrigins.TableBoundary },
      { page: getPageCount() - 1, forward: false, row: searchOrigins.TableBoundary }
    ]

    const [origin] = _.sortBy(origins, origin => Math.abs(targetPage - origin.page))
    return setActiveItem(item => item.index === index, origin.forward, origin.row)
  }

  //#endregion

  //#region Searching

  function getItemSearchValue(itemValue) {
    const item = draft.items[itemValue]
    const searchValue = _.get(item, searchProperty)
    return options.searchPhraseParser(searchValue)
  }

  function searchIndexAdd(value) {
    if (!searchProperty) return

    const searchValue = getItemSearchValue(value)
    let parent = draft[storeSymbols.searchIndex]
    for (const letter of searchValue)
      parent = (parent[letter] ??= { values: {} })

    setUtils.addItem(parent.values, value)
  }

  function searchIndexRemove(value, root = draft[storeSymbols.searchIndex], charIndex = 0) {
    if (!searchProperty) return

    const searchValue = getItemSearchValue(value)
    if (charIndex === searchValue.length)
      return setUtils.removeItem(root.values, value)

    const char = searchValue[charIndex]
    const child = root[char]
    if (!child) return

    searchIndexRemove(value, child, charIndex + 1)

    // If any items end in this character, don't delete
    if (!_.isEmpty(child.values)) return

    // If other words depend on this character, don't delete
    if (_.some(child, (value, key) => key !== 'values')) return

    delete root[char]
  }

  function addMatches(searchValue, root = draft[storeSymbols.searchIndex], charIndex = 0) {
    if (charIndex < searchValue.length) {
      const char = searchValue[charIndex]
      const child = root[char]
      if (!child) return

      addMatches(searchValue, child, charIndex + 1)
    } else {
      for (const value in root.values) {
        const item = draft.items[value]
        if (!item[storeSymbols.itemVisible]) continue

        draft[storeSymbols.searchMatches].push(value)
      }

      for (const char in root) {
        if (char.length > 1) continue
        addMatches(searchValue, root[char], charIndex + 1)
      }
    }
  }

  function rebuildMatches() {
    draft[storeSymbols.searchMatches] = []
    addMatches(options.searchPhraseParser(draft.searchPhrase))
    return draft[storeSymbols.searchMatches].sort(compareItems)
  }

  //#endregion

  //#region Addition

  function addUnlinkedItem(item) {
    // Reject if value is null or undefined
    const value = _.get(item, valueProperty)
    if (value == null) return null

    // Remove value property
    _.unset(item, valueProperty)

    // Add to list
    dlmapUtils.addUnlinkedItem(draft.items, value, item)

    // Set visibility
    setItemVisibility(value)

    // Add to search index
    searchIndexAdd(value)

    return value
  }

  function addItems(items) {
    const values = _.without(items.map(addUnlinkedItem), null)
    dlmapUtils.sortAndLinkItems(draft.items, values, compareItems)

    setActiveValue(getActiveValue())
    return values
  }

  //#endregion

  //#region Deletion

  function deleteItem(value) {
    const item = draft.items[value]
    if (!item) return

    // To update the visible item count
    setItemVisibility(value, false)
    searchIndexRemove(value)

    dlmapUtils.removeItem(draft.items, value)
  }

  function clearItems() {
    Object.assign(draft, {
      [storeSymbols.itemsHeadValue]: undefined,
      [storeSymbols.itemsTailValue]: undefined,
      [storeSymbols.visibleItemCount]: 0,
      [storeSymbols.rowValues]: [],
      items: {},
      isLoading: false,
      error: null,
      activeIndex: 0,
      pivotIndex: 0,
      selected: {}
    })
  }

  //#endregion

  //#region Selection

  function clearSelection(resetPivot = true) {
    draft.selected = {}

    if (resetPivot)
      draft.pivotIndex = draft.activeIndex
  }

  function setSelection(values) {
    clearSelection()

    for (const value of values) {
      setUtils.addItem(draft.selected, value)
      if (!options.multiSelect) break
    }
  }

  function setRangeSelected(state, selected) {
    const offset = draft.pivotIndex - state.activeIndex
    const values = valueIterator(true, offset > 0, getActiveValue(state))

    let distance = 0
    for (const value of values) {
      setUtils.toggleItem(draft.selected, value, selected)
      if (distance++ === Math.abs(offset)) break
    }
  }

  //#endregion

  return (state = initState, action) => {
    if (action.namespace !== namespace)
      return state

    return produce(state, newDraft => {
      draft = newDraft

      const { payload } = action

      let clearSearch = true

      // noinspection FallThroughInSwitchStatementJS
      switch (action.type) {
        // Items
        case types.SET_ITEMS: {
          clearItems()
          addItems(payload.items)
          break
        }
        case types.ADD_ITEMS: {
          const { items } = payload
          if (!items.length) break

          setSelection(addItems(items))
          break
        }
        case types.DELETE_ITEMS: {
          const valuesToDelete = new Set(payload.values)
          if (!valuesToDelete.size) break

          let setActive = null
          let finalizedActive = false

          const values = valueIterator(true)
          for (const value of values) {
            if (valuesToDelete.has(value)) {
              finalizedActive = true
              deleteItem(value)
            } else if (!finalizedActive)
              setActive = value
          }

          setActiveValue(setActive)
          break
        }
        case types.PATCH_ITEM_VALUES: {
          const patched = []

          _.forEach(payload.map, (newValue, oldValue) => {
            if (!isValueValid(oldValue)) return

            if (setUtils.removeItem(draft.selected, oldValue))
              setUtils.addItem(draft.selected, newValue)

            const item = _.set(draft.items[oldValue], valueProperty, newValue)
            patched.push(item)

            deleteItem(oldValue)
          })

          addItems(patched)
          break
        }
        case types.PATCH_ITEMS: {
          const { patches } = payload

          for (const patch of patches) {
            const value = _.get(patch, valueProperty)
            _.defaultsDeep(patch, draft.items[value])
          }

          addItems(patches)
          break
        }
        case types.SORT_ITEMS: {
          const { path } = payload

          const ascending = nextSortOrder[draft.sortAscending[path]]
          if (!payload.addToPrev)
            draft.sortAscending = { [path]: ascending ?? true }
          else if (ascending != null)
            draft.sortAscending[path] = ascending
          else
            delete draft.sortAscending[path]

          sortItems()
          break
        }
        case types.SET_ITEM_FILTER: {
          draft.filter = payload.filter

          const values = valueIterator()
          for (const value of values)
            setItemVisibility(value)

          setActiveValue(null)
          clearSelection()
          break
        }
        case types.CLEAR_ITEMS: {
          clearItems()
          break
        }
        case types.START_LOADING: {
          draft.isLoading = true
          break
        }
        case types.SET_ERROR: {
          Object.assign(draft, {
            isLoading: false,
            error: payload.error
          })
          break
        }

        // Selection
        case types.SET_ACTIVE: {
          const { index } = payload
          if (draft.activeIndex === index) break
          if (setActiveIndex(index) == null) break

          draft.pivotIndex = draft.activeIndex
          // draft.resetPivot = true
          break
        }
        case types.SELECT: {
          const { addToPrev, index } = payload

          const value = setActiveIndex(index)
          if (value == null) break

          // if (draft.resetPivot) {
          //   draft.pivotIndex = state.activeIndex
          //   draft.resetPivot = false
          // }

          const selected = !addToPrev || !draft.selected[value]

          if (!addToPrev || !options.multiSelect)
            clearSelection(false)

          if (payload.isRange && options.multiSelect) {
            if (addToPrev)
            // Clear previous selection
              setRangeSelected(state, false)

            setRangeSelected(draft, true)
            break
          }

          draft.pivotIndex = index
          setUtils.toggleItem(draft.selected, value, selected)
          break
        }
        case types.CLEAR_SELECTION: {
          clearSelection()
          break
        }
        case types.SET_SELECTED: {
          // Active index
          setActiveIndex(payload.activeIndex)

          // Pivot index
          const { pivotIndex } = payload
          if (isIndexValid(pivotIndex))
            draft.pivotIndex = pivotIndex
            // draft.resetPivot = false

          // Selection
          const { map } = payload
          for (const value in map) {
            if (!isValueValid(value)) continue
            setUtils.toggleItem(draft.selected, value, map[value])
          }

          break
        }
        case types.SELECT_ALL: {
          if (!options.multiSelect) return
          setSelection(draft[storeSymbols.rowValues])
          break
        }

        // Search
        case types.SEARCH: {
          clearSearch = false

          if (!(draft.searchPhrase = payload.phrase)) break
          payload.index = rebuildMatches().length
        }
        // eslint-disable-next-line no-fallthrough
        case types.GO_TO_MATCH: {
          clearSearch = false

          const { [storeSymbols.searchMatches]: matches } = draft
          const matchCount = matches.length
          if (!matchCount) break

          const { index } = payload

          const safeIndex = ((index % matchCount) + matchCount) % matchCount
          const origin = index === safeIndex ? searchOrigins.ActiveRow : searchOrigins.TableBoundary
          setActiveValue(matches[safeIndex], index >= draft[storeSymbols.searchMatchIndex], origin)

          draft[storeSymbols.searchMatchIndex] = safeIndex
          break
        }

        // Pagination
        case types.SET_PAGE_SIZE: {
          const newSize = parseInt(payload.size)
          // NaN >= x is false so doing the comparison in this way avoids an isNaN check
          if (!(newSize >= 0)) break

          draft.pageSize = newSize
          setActiveIndex(state.activeIndex, true)
          break
        }
        default: return
      }

      if (clearSearch)
        draft.searchPhrase = null
    })
  }
}
