import _ from 'lodash'
import produce from 'immer'
import { types } from '../models/Actions'
import { createTableUtils } from '../utils/tableUtils'
import { compareAscending } from '../utils/sortUtils'
import * as setUtils from '../utils/setUtils'
import * as selectors from '../selectors/selectors'

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
 * @property {RowValue} headValue The head of {@link sortedItems}
 * @property {RowValue} tailValue The tail of {@link sortedItems}
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
  const { getItemValue } = createTableUtils(namespace, options)

  let draft
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
    searchIndex: {},
    searchPhrase: null,
    matches: [],
    matchIndex: 0,
    sortedItems: {},
    headValue: undefined,
    tailValue: undefined,
    rowValues: [],
    visibleItemCount: 0,
    activeIndex: 0,
    pivotIndex: 0,
    selected: {},
    // resetPivot: false,

    ...savedState.initialState
  }

  //#region Validation

  function isIndexValid(index) {
    return index != null && _.inRange(index, draft.visibleItemCount)
  }

  function isValueValid(value, checkVisible = false) {
    if (value == null) return false

    const item = draft.sortedItems[value]
    if (!item) return false

    return !checkVisible || item.visible
  }

  //#endregion

  //#region Visibility

  function setItemVisibility(value, visibility = null) {
    const item = draft.sortedItems[value]
    visibility ??= options.itemPredicate(item.data, draft.filter)

    if (!!item.visible !== visibility) {
      item.visible = visibility
      draft.visibleItemCount += visibility ? 1 : -1
    }

    return visibility
  }

  //#endregion

  //#region Sorting

  function compareItemData(lhs, rhs) {
    const compareProperty = (comparator, path) =>
      comparator(_.get(lhs, path), _.get(rhs, path), path)

    let factor = 1
    for (const path in draft.sortAscending) {
      factor = draft.sortAscending[path] ? 1 : -1

      const result = compareProperty(options.itemComparator, path) ?? compareProperty(compareAscending, path)
      if (result) return result * factor
    }

    // Ensure that reversing the sort order of a column with all equal values, reverses the item order
    return compareProperty(compareAscending, valueProperty) * factor
  }

  function setItemOrder(first, second) {
    const {
      [second]: secondItem,
      [first]: firstItem
    } = draft.sortedItems

    if (secondItem)
      secondItem.prev = first
    else
      draft.tailValue = first

    if (firstItem)
      firstItem.next = second
    else
      draft.headValue = second
  }

  function compareItemsByValue(lhs, rhs) {
    const {
      [lhs]: { data: lhsData },
      [rhs]: { data: rhsData }
    } = draft.sortedItems

    return compareItemData(lhsData, rhsData)
  }

  function sortItems() {
    const itemValues = [...valueIterator()].sort(compareItemsByValue)

    // eslint-disable-next-line no-undef-init
    let prevValue = undefined
    for (const value of itemValues) {
      setItemOrder(prevValue, value)
      prevValue = value
    }

    setItemOrder(prevValue, undefined)

    setActiveValue(null)
    clearSelection()
  }

  //#endregion

  //#region Querying

  function * valueIterator(
    onlyVisible = false,
    forward = true,
    originValue = (forward ? draft.headValue : draft.tailValue)
  ) {
    while (originValue !== undefined) {
      const item = draft.sortedItems[originValue]
      if (!onlyVisible || item.visible)
        yield originValue

      originValue = item[forward ? 'next' : 'prev']
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
        index: forward ? 0 : draft.visibleItemCount - 1,
        value: undefined,
        isVisible: false
      }
    }

    return {
      index: rowIndex + getPageIndexOffset(),
      value: draft.rowValues[rowIndex],
      isVisible: true
    }
  }

  function setActiveItem(callback, searchForward, searchOrigin) {
    const pageBoundary = getPageBoundary(searchForward)
    const pageSize = getPageSize()
    const origin = resolveSearchOrigin(searchOrigin, searchForward)
    let rowValues = origin.isVisible ? draft.rowValues : []

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
      draft.rowValues = rowValues
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
    const item = draft.sortedItems[itemValue]
    const searchValue = _.get(item.data, searchProperty)
    return options.searchPhraseParser(searchValue)
  }

  function searchIndexAdd(value) {
    if (!searchProperty) return

    const searchValue = getItemSearchValue(value)

    let parent = draft.searchIndex
    for (const letter of searchValue)
      parent = (parent[letter] ??= { values: {} })

    setUtils.addItem(parent.values, value)
  }

  function _searchIndexRemove(root, itemValue, searchValue, index) {
    if (index === searchValue.length)
      return setUtils.removeItem(root.values, itemValue)

    const char = searchValue[index]
    const child = root[char]
    if (!child) return

    _searchIndexRemove(child, itemValue, searchValue, index + 1)

    // If any items end in this character, don't delete
    if (!_.isEmpty(child.values)) return

    // If other words depend on this character, don't delete
    if (_.some(child, (value, key) => key !== 'values')) return

    delete root[char]
  }

  function searchIndexRemove(value) {
    if (!searchProperty) return

    const searchValue = getItemSearchValue(value)
    _searchIndexRemove(draft.searchIndex, value, searchValue, 0)
  }

  function _addMatches(root, searchPhrase, index) {
    if (index < searchPhrase.length) {
      const char = searchPhrase[index]
      const child = root[char]
      if (!child) return

      _addMatches(child, searchPhrase, index + 1)
    } else {
      for (const value in root.values) {
        const item = draft.sortedItems[value]
        if (!item.visible) continue

        draft.matches.push(value)
      }

      for (const char in root) {
        if (char.length > 1) continue
        _addMatches(root[char], searchPhrase, index + 1)
      }
    }
  }

  function reloadMatches() {
    draft.matches = []
    _addMatches(draft.searchIndex, options.searchPhraseParser(draft.searchPhrase), 0)
    return draft.matches.sort(compareItemsByValue)
  }

  //#endregion

  //#region Addition

  function addItem(data, prev, next) {
    // Reject if value is null or undefined
    const value = getItemValue(data)
    if (value == null) return null

    // Add item
    draft.sortedItems[value] = { data }

    // Set position
    setItemOrder(prev, value)
    setItemOrder(value, next)

    // Set visibility
    setItemVisibility(value)

    // Add to search index
    searchIndexAdd(value)

    return value
  }

  function addItems(itemData) {
    for (const data of itemData.sort(compareItemData))
      deleteItem(getItemValue(data), true)

    const values = valueIterator()
    const addedValues = []

    let dataIndex = 0
    let nextValue = values.next()
    while (!nextValue.done && dataIndex < itemData.length) {
      let value = nextValue.value
      const item = draft.sortedItems[value]
      const data = itemData[dataIndex]

      if (compareItemData(data, item.data) < 0) {
        value = addItem(data, item.prev, value)
        addedValues.push(value)
        dataIndex++
      } else
        nextValue = values.next()
    }

    for (; dataIndex < itemData.length; dataIndex++)
      addedValues.push(addItem(itemData[dataIndex], draft.tailValue))

    setActiveValue(getActiveValue())

    return addedValues
  }

  //#endregion

  //#region Deletion

  function deleteItem(value, toBeReplaced = false) {
    const item = draft.sortedItems[value]
    if (!item) return

    // To update the visible item count
    setItemVisibility(value, false)
    setItemOrder(item.prev, item.next)
    searchIndexRemove(value)

    if (toBeReplaced) return
    delete draft.sortedItems[value]
  }

  function clearItems() {
    Object.assign(draft, {
      headValue: undefined,
      tailValue: undefined,
      visibleItemCount: 0,
      rowValues: [],
      sortedItems: {},
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

            const { data } = draft.sortedItems[oldValue]
            patched.push(_.set(data, valueProperty, newValue))

            deleteItem(oldValue)
          })

          addItems(patched)
          break
        }
        case types.PATCH_ITEMS: {
          const { patches } = payload

          for (const patch of patches) {
            const value = getItemValue(patch)
            _.defaultsDeep(patch, draft.sortedItems[value].data)
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
          setSelection(draft.rowValues)
          break
        }

        // Search
        case types.SEARCH: {
          if (!(draft.searchPhrase = payload.phrase)) break
          payload.index = reloadMatches().length
        }
        // eslint-disable-next-line no-fallthrough
        case types.GO_TO_MATCH: {
          const { matches, matches: { length: matchCount } } = draft
          if (!matchCount) break

          const { index } = payload

          const safeIndex = ((index % matchCount) + matchCount) % matchCount
          const origin = index === safeIndex ? searchOrigins.ActiveRow : searchOrigins.TableBoundary
          setActiveValue(matches[safeIndex], index >= draft.matchIndex, origin)

          draft.matchIndex = safeIndex
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

      if (action.clearSearch)
        draft.searchPhrase = null
    })
  }
}
