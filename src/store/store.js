import _ from 'lodash'
import produce from 'immer'
import { types } from '../models/Actions'
import { createTableUtils } from '../utils/tableUtils'
import { compareAscending } from '../utils/sortUtils'
import * as setUtils from '../utils/setUtils'
import {
  getActiveKey,
  getActiveRowIndex,
  getPageCount,
  getPageIndex,
  getPageSize,
  getPageIndexOffset,
  getItemPageIndex
} from '../selectors/selectors'
import * as dlMapUtils from '../utils/doublyLinkedMapUtils'
import * as trieUtils from '../utils/trieUtils'

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
 * The key of the row as returned from {@link https://lodash.com/docs/4.17.15#keyBy|_.keyBy} with iteratee {@link Options.keyBy}
 *
 * @typedef {string|number} RowKey
 */

/**
 * @typedef {object} RowMetadata
 * @property {boolean} visible The visibility of the item, based on the filter
 */

/**
 * @typedef {object} State
 * @property {import('../utils/setUtils').Set<RowKey>} selection A set containing all selected row keys
 * @property {*} filter The item filter
 * @property {Object<string, boolean>} sortAscending An object with property paths as keys, and true for ascending order or false for descending, as values
 * @property {boolean} isLoading When true, a loading indicator is displayed
 * @property {number} pageSize The maximum number of items in a page, 0 if pagination is disabled
 * @property {*} error When truthy, it is passed as a child to {@link TableProps.errorComponent} which in turn is rendered instead of the table rows
 * @property {import('../utils/trieUtils').TrieNode<RowKey>} searchIndex The root node of a trie made from the {@link Options.searchProperty} value of each row after being parsed by {@link Options.searchPhraseParser}
 * @property {string} searchPhrase The search phrase after being parsed by {@link Options.searchPhraseParser}
 * @property {RowKey[]} matches The keys of the rows that matched the search phrase, sorted in the order they appear
 * @property {number} matchIndex The currently highlighted match index
 * @property {import('../utils/doublyLinkedMapUtils').DoublyLinkedMap<RowKey, object, RowMetadata>} items A list of all items, sorted based on {@link sortAscending}
 * @property {RowKey[]} rowKeys The keys of the visible items, sorted and paginated
 * @property {number} visibleItemCount The total number of visible items on all pages
 * @property {number} activeIndex The index of the active row inside {@link rowKeys}
 * @property {number} pivotIndex The index of the pivot row inside {@link rowKeys}
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
    keyBy,
    searchProperty
  } = options

  const noItemsState = {
    visibleItemCount: 0,
    rowKeys: [],
    searchIndex: trieUtils.instance(),
    searchMatches: [],
    searchMatchIndex: 0,
    items: dlMapUtils.instance(),
    isLoading: false,
    error: null,
    activeIndex: 0,
    pivotIndex: 0,
    selected: setUtils.instance()
  }

  const initState = {
    filter: null,
    sortAscending: {},
    pageSize: 0,
    searchPhrase: null,
    // resetPivot: false,

    ...noItemsState
  }

  let draft = initState

  //#region Load save state

  if (options.savedState) {
    const saved = options.savedState
    const load = (...props) => Object.assign(draft, _.pick(saved, props))
    const isSaved = name => Object.hasOwn(saved, name)

    load('filter', 'sortAscending', 'error', 'isLoading', 'pageSize', 'searchPhrase')

    if (isSaved('items'))
      addKeyedItems(keyItems(saved.items))

    let activeKey = null
    if (isSaved('activeIndex')) {
      activeKey = setActiveIndex(saved.activeIndex, true)
      draft.pivotIndex = saved.activeIndex
    }

    if (draft.searchPhrase)
      draft.searchMatchIndex = _.findIndex(updateSearchMatches(), activeKey)

    if (isSaved('selected'))
      saved.selected.forEach(v => setUtils.addItem(draft.selected, v))

    load('pivotIndex')
  }

  //#endregion

  //#region Validation

  function isIndexValid(index) {
    return index != null && _.inRange(index, draft.visibleItemCount)
  }

  function isKeyValid(key, checkVisible = false) {
    if (key == null) return false

    const itemMetadata = dlMapUtils.getItemMetadata(draft.items, key)
    if (!itemMetadata) return false

    return !checkVisible || itemMetadata.visible
  }

  //#endregion

  //#region Sorting

  function compareItems(lhsKey, rhsKey) {
    const compareProperty = (comparator, path) => comparator(
      _.get(dlMapUtils.getItem(draft.items, lhsKey), path),
      _.get(dlMapUtils.getItem(draft.items, rhsKey), path),
      path
    )

    let factor = 1
    for (const path in draft.sortAscending) {
      factor = draft.sortAscending[path] ? 1 : -1

      const result = compareProperty(options.itemComparator, path) ?? compareProperty(compareAscending, path)
      if (result) return result * factor
    }

    // Ensure that reversing the sort order of a column with all equal values, reverses the item order
    return compareAscending(lhsKey, rhsKey) * factor
  }

  function sortItems() {
    dlMapUtils.sortItems(draft.items, compareItems)

    setActiveKey(null)
    clearSelection()
  }

  //#endregion

  //#region Querying

  //#endregion

  //#region Pagination

  function getPageBoundary(start) {
    return start ? 0 : getPageSize(draft) - 1
  }

  function resolveSearchOrigin(origin, forward) {
    let rowIndex
    switch (origin) {
      case searchOrigins.PageBoundary:
        rowIndex = getPageBoundary(!forward)
        break
      case searchOrigins.ActiveRow:
        rowIndex = getActiveRowIndex(draft)
        break
      default: return {
        index: forward ? -1 : draft.visibleItemCount,
        key: null
      }
    }

    return {
      index: rowIndex + getPageIndexOffset(draft),
      key: draft.rowKeys[rowIndex]
    }
  }

  function setActiveItem(callback, searchForward, searchOrigin) {
    const pageSize = getPageSize(draft)
    const origin = resolveSearchOrigin(searchOrigin, searchForward)
    let rowKeys = origin.key != null ? draft.rowKeys : []

    let setActive = null
    let { index } = origin
    for (const key of visibleKeyIterator(searchForward, origin.key)) {
      index += searchForward ? 1 : -1
      const rowIndex = index % pageSize

      if (rowIndex === getPageBoundary(searchForward)) {
        if (setActive != null) break
        rowKeys = []
      }

      rowKeys[rowIndex] = key
      if (!callback({ key, index })) continue

      setActive ??= index
      if (rowKeys === draft.rowKeys) break
    }

    if (setActive == null) return null

    draft.activeIndex = setActive
    draft.rowKeys = rowKeys
    return getActiveKey(draft)
  }

  function setActiveKey(key, searchForward = true, searchOrigin = searchOrigins.TableBoundary) {
    const callback = isKeyValid(key, true)
      ? item => item.key.toString() === key.toString()
      : () => true
    setActiveItem(callback, searchForward, searchOrigin)
  }

  function setActiveIndex(index, pageInvalid = false) {
    if (!isIndexValid(index)) return null

    const currentPage = pageInvalid ? NaN : getPageIndex(draft)
    const targetPage = getItemPageIndex(draft, index)
    if (currentPage === targetPage) {
      draft.activeIndex = index
      return getActiveKey(draft)
    }

    const afterCurrent = targetPage > currentPage
    const origins = [
      { page: currentPage, forward: afterCurrent, row: searchOrigins.PageBoundary },
      { page: 0, forward: true, row: searchOrigins.TableBoundary },
      { page: getPageCount(draft) - 1, forward: false, row: searchOrigins.TableBoundary }
    ]

    const [origin] = _.sortBy(origins, origin => Math.abs(targetPage - origin.page))
    return setActiveItem(item => item.index === index, origin.forward, origin.row)
  }

  //#endregion

  //#region Searching

  function getItemSearchText(key) {
    const item = dlMapUtils.getItem(draft.items, key)
    const text = _.get(item, searchProperty)
    return options.searchPhraseParser(text)
  }

  function searchIndexAdd(key) {
    if (!searchProperty) return

    const text = getItemSearchText(key)
    trieUtils.addNode(draft.searchIndex, key, text)
  }

  function searchIndexRemove(key) {
    if (!searchProperty) return

    const text = getItemSearchText(key)
    trieUtils.removeNode(draft.searchIndex, key, text)
  }

  function updateSearchMatches() {
    if (!searchProperty) return

    const phrase = options.searchPhraseParser(draft.searchPhrase)
    const allMatches = trieUtils.getMatchingKeys(draft.searchIndex, phrase)
    const visibleMatches = allMatches.filter(key =>
      dlMapUtils.getItemMetadata(draft.items, key).visible)
    draft.searchMatches = visibleMatches.sort(compareItems)

    return visibleMatches
  }

  //#endregion

  //#region Items

  function setItemVisibility(key, visibility) {
    const itemMetadata = dlMapUtils.getItemMetadata(draft.items, key)
    if (!!itemMetadata.visible !== visibility) {
      itemMetadata.visible = visibility
      draft.visibleItemCount += visibility ? 1 : -1
    }
  }

  function filterItem(key) {
    const item = dlMapUtils.getItem(draft.items, key)
    const visible = options.itemPredicate(item, draft.filter)

    if (!visible)
      setUtils.removeItem(draft.selected, key)

    setItemVisibility(key, visible)
    return visible
  }

  function * visibleKeyIterator(forward = true, originKey = null) {
    const iterator = dlMapUtils.keyIterator(draft.items, forward, originKey)
    for (const key of iterator) {
      const itemMetadata = dlMapUtils.getItemMetadata(draft.items, key)
      if (!itemMetadata.visible) continue

      yield key
    }
  }

  function addUnlinkedItem(item, key) {
    // Delete old row with the same key
    deleteItemForReplacing(key)

    // Add to list
    dlMapUtils.addUnlinkedItem(draft.items, key, item, {})

    // Filter item and deselect if not visible
    filterItem(key)

    // Add to search index
    searchIndexAdd(key)
  }

  function addKeyedItems(keyedItems) {
    _.forEach(keyedItems, addUnlinkedItem)

    const keys = Object.keys(keyedItems)
    dlMapUtils.sortAndLinkItems(draft.items, keys, compareItems)

    setActiveKey(getActiveKey(draft))
    return keys
  }

  function keyItems(items) {
    return _.keyBy(items, keyBy)
  }

  function deleteItemForReplacing(key) {
    if (!dlMapUtils.getItem(draft.items, key)) return

    // To update the visible item count
    setItemVisibility(key, false)
    searchIndexRemove(key)

    dlMapUtils.deleteItem(draft.items, key)
  }

  function deleteItem(key) {
    deleteItemForReplacing(key)
    setUtils.removeItem(draft.selected, key)
  }

  function clearItems() {
    Object.assign(draft, noItemsState)
  }

  //#endregion

  //#region Selection

  function clearSelection(resetPivot = true) {
    draft.selected = setUtils.instance()

    if (resetPivot)
      draft.pivotIndex = draft.activeIndex
  }

  function setSelection(keys) {
    clearSelection()

    for (const key of keys) {
      setUtils.addItem(draft.selected, key)
      if (!options.multiSelect) break
    }
  }

  function setRangeSelected(state, selected) {
    const offset = draft.pivotIndex - state.activeIndex

    const activeKey = getActiveKey(state)
    setUtils.toggleItem(draft.selected, activeKey, selected)
    if (offset === 0) return

    let distance = 0
    for (const key of visibleKeyIterator(offset > 0, activeKey)) {
      setUtils.toggleItem(draft.selected, key, selected)
      if (++distance >= Math.abs(offset)) break
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
          addKeyedItems(keyItems(payload.items))
          break
        }
        case types.ADD_ITEMS: {
          const { items } = payload
          if (!items.length) break

          setSelection(addKeyedItems(keyItems(items)))
          break
        }
        case types.DELETE_ITEMS: {
          const keys = payload.keys.sort(compareItems)
          if (!keys.length) break

          const setActive = visibleKeyIterator(false, keys[0]).next().value
          keys.forEach(deleteItem)
          setActiveKey(setActive)
          break
        }
        case types.PATCH_ITEMS_BY_KEY: {
          const selectedSym = Symbol('Selected')

          const { patchMap } = payload
          for (const key in patchMap) {
            _.defaultsDeep(patchMap[key], dlMapUtils.getItem(draft.items, key))
            patchMap[key][selectedSym] = setUtils.hasItem(draft.selected, key)
            deleteItem(key)
          }

          const keyedItems = keyItems(patchMap)
          for (const key in keyedItems) {
            const item = keyedItems[key]
            if (item[selectedSym])
              // Items that become hidden after the patch, will be de-selected when filtered
              setUtils.addItem(draft.selected, key)

            delete item[selectedSym]
          }

          // Note: A item will be selected after the patch if:
          // The item was selected before the patch OR
          // The item it is replacing after the patch is selected
          addKeyedItems(keyedItems)
          break
        }
        case types.PATCH_ITEMS: {
          const keyedPatches = keyItems(payload.patches)
          for (const key in keyedPatches)
            _.defaultsDeep(keyedPatches[key], dlMapUtils.getItem(draft.items, key))

          addKeyedItems(keyedPatches)
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

          const keys = dlMapUtils.keyIterator(draft.items)
          for (const key of keys)
            filterItem(key)

          setActiveKey(null)
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

          const key = setActiveIndex(index)
          if (key == null) break

          // if (draft.resetPivot) {
          //   draft.pivotIndex = state.activeIndex
          //   draft.resetPivot = false
          // }

          const selected = !addToPrev || !setUtils.hasItem(draft.selected, key)

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
          setUtils.toggleItem(draft.selected, key, selected)
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
          for (const key in map) {
            if (!isKeyValid(key)) continue
            setUtils.toggleItem(draft.selected, key, map[key])
          }

          break
        }
        case types.SELECT_ALL: {
          if (!options.multiSelect) return
          setSelection(draft.rowKeys)
          break
        }

        // Search
        case types.SEARCH: {
          clearSearch = false

          if (!(draft.searchPhrase = payload.phrase)) break
          payload.index = updateSearchMatches().length
        }
        // eslint-disable-next-line no-fallthrough
        case types.GO_TO_MATCH: {
          clearSearch = false

          const { searchMatches: matches } = draft
          const matchCount = matches.length
          if (!matchCount) break

          const { index } = payload

          const safeIndex = ((index % matchCount) + matchCount) % matchCount
          const origin = index === safeIndex ? searchOrigins.ActiveRow : searchOrigins.TableBoundary
          setActiveKey(matches[safeIndex], index >= draft.searchMatchIndex, origin)

          draft.searchMatchIndex = safeIndex
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
