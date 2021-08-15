// noinspection StatementWithEmptyBodyJS

import _ from "lodash";
import produce, {enableMapSet} from "immer";
import {types} from "../models/Actions";
import {setOptions} from "../utils/tableUtils";
import {compareAscending} from "../utils/sortUtils";

enableMapSet();

const nextSortOrder = Object.freeze({
    undefined: true,
    true: false,
    false: undefined
});

// noinspection StatementWithEmptyBodyJS
export default function createTable(namespace, options = {}) {
    let draft;

    const utils = setOptions(namespace, options);

    const {
        getActiveValue,
        getActiveRowIndex,
        getPageCount,
        getPageIndex,
        getPageIndexOffset,
        getItemPageIndex
    } = _.mapValues(utils.private.selectors, selector =>
        (state = draft, ...rest) => selector(state, ...rest));

    const {
        valueProperty,
        searchProperty,
        multiSelect
    } = options;

    const initState = {
        selection: new Set(),
        filter: null,
        sortAscending: new Map(),
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
        resetPivotForRelative: false,

        ...options.initState
    };

    //#region Validation

    function isIndexValid(index) {
        return index != null && _.inRange(index, draft.visibleItemCount);
    }

    function validateValue(value, checkVisible = false) {
        if (value == null) return null;

        const item = draft.sortedItems[value];

        if (!item) return null;
        if (checkVisible && !item.visible) return null;

        return getDataValue(item.data);
    }

    //#endregion

    //#region Visibility

    function setItemVisibility(value, visibility = null) {
        const item = draft.sortedItems[value];
        visibility ??= options.itemPredicate(item.data, draft.filter);

        if (!!item.visible !== visibility) {
            item.visible = visibility;
            draft.visibleItemCount += visibility ? 1 : -1;
        }

        return visibility;
    }

    //#endregion

    //#region Sorting

    function compareItemData(dataA, dataB) {
        const compareProperty = (comparator, path) =>
            comparator(_.get(dataA, path), _.get(dataB, path));

        //Make it so that reversing the sort order of a column with all equal values, reverses the item order
        let factor = 1;
        for (let [path, ascending] of draft.sortAscending) {
            factor = ascending ? 1 : -1

            const comparator = _.get(options.itemComparators, path, compareAscending);
            const result = compareProperty(comparator, path);

            if (!result) continue;

            return result * factor;
        }

        return compareProperty(compareAscending, valueProperty) * factor;
    }

    function compareItems(valueA, valueB) {
        const {
            [valueA]: { data: dataA },
            [valueB]: { data: dataB }
        } = draft.sortedItems;

        return compareItemData(dataA, dataB);
    }

    function setItemOrder(first, second) {
        const {
            [second]: secondItem,
            [first]: firstItem
        } = draft.sortedItems

        if (secondItem)
            secondItem.prev = first;
        else
            draft.tailValue = first;

        if (firstItem)
            firstItem.next = second;
        else
            draft.headValue = second;
    }

    function sortNative() {
        const itemValues = [...createValueIterator()].sort(compareItems);

        let prevValue = undefined;
        for (let value of itemValues) {
            setItemOrder(prevValue, value);
            prevValue = value;
        }

        setItemOrder(prevValue, undefined);

        resetPage();
        clearSelection();
    }

    //#endregion

    //#region Querying

    function getDataValue(data) {
        return _.get(data, valueProperty);
    }

    function* createValueIterator(onlyVisible = false, forward = true, originValue = null) {
        let value = originValue ?? (forward ? draft.headValue : draft.tailValue);
        while (value !== undefined) {
            const item = draft.sortedItems[value];
            if (!onlyVisible || item.visible)
                yield value;

            value = item[forward ? "next" : "prev"];
        }
    }

    //#endregion

    //#region Pagination

    function resetPage() {
        setActiveItem(() => true, true);
    }

    function setActiveItem(callback, searchForward, originRowIndex = -1) {
        let { rowValues } = draft;
        let originValue, index;

        if (originRowIndex < 0) {
            rowValues = [];
            index = searchForward ? 0 : draft.visibleItemCount - 1;
        } else {
            originValue = rowValues[originRowIndex];
            index = getPageIndexOffset() + originRowIndex;
        }

        let setActive = null;
        const pageEnd = searchForward ? draft.pageSize - 1 : 0;

        const values = createValueIterator(true, searchForward, originValue);
        for (let value of values) {
            const rowIndex = index % draft.pageSize;
            rowValues[rowIndex] = value;

            if (value !== originValue && callback({ value, index }))
                setActive ??= index;

            index += searchForward ? 1 : -1;

            if (rowIndex !== pageEnd) continue;
            if (setActive != null) break;

            rowValues = [];
        }

        if (setActive == null) return false;

        draft.activeIndex = setActive;
        draft.rowValues = rowValues;
        return true;
    }

    function setActiveValue(value, searchForward, searchAll = false) {
        value = validateValue(value, true);
        if (value == null) return false;

        const originRow = searchAll ? -1 : getActiveRowIndex();
        return setActiveItem(item => item.value === value, searchForward, originRow);
    }

    function goToActiveValue() {
        const activeValue = validateValue(getActiveValue(), true);
        if (activeValue == null) return resetPage();

        return setActiveItem(item => item.value === activeValue, true);
    }

    function setActiveIndex(index, fromStart = false) {
        if (!isIndexValid(index)) return false;

        const currentPage = fromStart ? NaN : getPageIndex();
        const targetPage = getItemPageIndex(draft, index);
        if (currentPage === targetPage) {
            draft.activeIndex = index;
            return true;
        }

        const afterCurrent = targetPage > currentPage;
        const pageEnd = afterCurrent ? draft.rowValues.length - 1 : 0;
        const origins = [
            { page: currentPage,           forward: afterCurrent,   row: pageEnd },
            { page: 0,                     forward: true,           row: -1      },
            { page: getPageCount() - 1,    forward: false,          row: -1      }
        ];

        const [origin] = _.sortBy(origins, origin => Math.abs(targetPage - origin.page));
        return setActiveItem(item => item.index === index, origin.forward, origin.row);
    }

    //#endregion

    //#region Searching

    function getItemSearchValue(itemValue) {
        const item = draft.sortedItems[itemValue];
        const searchValue = _.get(item.data, searchProperty);
        return options.searchValueParser(searchValue);
    }

    function searchIndexAdd(value) {
        if (!searchProperty) return;

        const searchValue = getItemSearchValue(value);

        let parent = draft.searchIndex;
        for (let letter of searchValue)
            parent = parent[letter] ??= { values: new Set() };

        parent.values.add(value);
    }

    function _searchIndexRemove(root, itemValue, searchValue, index) {
        if (index === searchValue.length)
            return root.values.delete(itemValue);

        const char = searchValue[index];
        const child = root[char];
        if (!child) return;

        _searchIndexRemove(child, itemValue, searchValue, index + 1);

        //If any items end in this character, don't delete
        if (child.values.size) return;

        let propertyCount = 0;
        for (let prop in child) {
            //If other words depend on this character, don't delete
            if (++propertyCount > 1) return; //All nodes have a 'values' property
        }

        delete root[char];
    }

    function searchIndexRemove(value) {
        if (!searchProperty) return;

        const searchValue = getItemSearchValue(value);
        _searchIndexRemove(draft.searchIndex, value, searchValue, 0);
    }

    function addMatches(root, searchPhrase, index) {
        if (index < searchPhrase.length) {
            const char = searchPhrase[index];
            const child = root[char];
            if (!child) return;

            addMatches(child, searchPhrase, index + 1);
        } else {
            for (let value of root.values) {
                const item = draft.sortedItems[value];
                if (!item.visible) continue;

                draft.matches.push(value);
            }

            for (let char in root) {
                if (char.length > 1) continue;
                addMatches(root[char], searchPhrase, index + 1);
            }
        }
    }

    //#endregion

    //#region Addition

    function addItem(data, prev, next) {
        //Reject if value is null or undefined
        const value = getDataValue(data);
        if (value == null) return null;

        //Add item
        draft.sortedItems[value] = { data };

        //Set position
        setItemOrder(prev, value);
        setItemOrder(value, next);

        //Set visibility
        setItemVisibility(value);

        //Add to search index
        searchIndexAdd(value);

        return value;
    }

    function addItems(itemData) {
        for (let data of itemData.sort(compareItemData))
            deleteItem(getDataValue(data), true);

        const values = createValueIterator();
        const addedValues = [];

        let dataIndex = 0;
        let nextValue = values.next();
        while (!nextValue.done && dataIndex < itemData.length) {
            let value = nextValue.value;
            const item = draft.sortedItems[value];
            const data = itemData[dataIndex];

            if (compareItemData(data, item.data) < 0) {
                value = addItem(data, item.prev, value);
                addedValues.push(value);
                dataIndex++;
            } else {
                nextValue = values.next();
            }
        }

        for (; dataIndex < itemData.length; dataIndex++)
            addedValues.push(addItem(itemData[dataIndex], draft.tailValue));

        goToActiveValue();

        return addedValues;
    }

    //#endregion

    //#region Deletion

    function deleteItem(value, toBeReplaced = false) {
        const item = draft.sortedItems[value];
        if (!item) return;

        setItemVisibility(value, false);
        setItemOrder(item.prev, item.next);
        searchIndexRemove(value);

        if (toBeReplaced) return;
        delete draft.sortedItems[value];
        draft.selection.delete(value);
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
            selection: new Set()
        });
    }

    //#endregion

    //#region Selection

    function resetPivot() {
        draft.pivotIndex = draft.activeIndex;
    }

    function clearSelection() {
        draft.selection.clear();
        resetPivot();
    }

    function setSelection(values) {
        if (!multiSelect) return;

        clearSelection();
        for (let value of values)
            draft.selection.add(value);
    }

    function setValueSelected(value, selected) {
        const { selection } = draft;

        if (!multiSelect)
            selection.clear();

        if (selected)
            selection.add(value);
        else
            selection.delete(value);
    }

    function setRangeSelected(state, selected) {
        const offset = draft.pivotIndex - state.activeIndex;
        const values = createValueIterator(true, offset > 0, getActiveValue(state));

        let distance = 0;
        for (let value of values) {
            setValueSelected(value, selected);
            if (distance++ === Math.abs(offset)) break;
        }
    }

    //#endregion


    return (state = initState, action) => {
        if (action.namespace !== namespace)
            return state;

        return produce(state, newDraft => {
            draft = newDraft;

            const { payload } = action;

            switch (action.type) {
                //Items
                case types.SET_ITEMS: {
                    clearItems();
                    addItems(payload.items);
                    break;
                }
                case types.ADD_ITEMS: {
                    const {items} = payload;
                    if (!items.length) break;

                    setSelection(addItems(items));
                    break;
                }
                case types.DELETE_ITEMS: {
                    const valuesToDelete = new Set(payload.values);
                    if (!valuesToDelete.size) break;

                    let setActive = null;
                    let finalizedActive = false;

                    const values = createValueIterator(true);
                    for (let value of values) {
                        if (valuesToDelete.has(value)) {
                            finalizedActive = true;
                            deleteItem(value);
                        } else if (!finalizedActive) {
                            setActive = value;
                        }
                    }

                    setActiveValue(setActive);
                    break;
                }
                case types.PATCH_ITEM_VALUES: {
                    const patched = [];

                    _.forEach(payload.map, (newValue, oldValue) => {
                        oldValue = validateValue(oldValue);
                        if (oldValue === null) return;

                        const { selection } = draft;
                        if (selection.delete(oldValue))
                            selection.add(newValue);

                        const { data } = draft.sortedItems[oldValue];
                        patched.push(_.set(data, valueProperty, newValue));

                        deleteItem(oldValue);
                    });

                    addItems(patched);
                    break;
                }
                case types.PATCH_ITEMS: {
                    const { patches } = payload;

                    for (let patch of patches) {
                        const value = getDataValue(patch);
                        _.defaultsDeep(patch, draft.sortedItems[value].data);
                    }

                    addItems(patches);
                    break;
                }
                case types.SORT_ITEMS: {
                    const {path} = payload;
                    const {sortAscending} = draft;

                    let ascending = nextSortOrder[sortAscending.get(path)];

                    if (!payload.addToPrev) {
                        sortAscending.clear();
                        ascending ??= true;
                    }

                    if (ascending === undefined)
                        sortAscending.delete(path);
                    else
                        sortAscending.set(path, ascending);

                    sortNative();
                    break;
                }
                case types.SET_ITEM_FILTER: {
                    draft.filter = payload.filter;

                    const values = createValueIterator();
                    for (let value of values)
                        setItemVisibility(value)

                    resetPage();
                    clearSelection();
                    break;
                }
                case types.CLEAR_ITEMS: {
                    clearItems();
                    break;
                }
                case types.START_LOADING: {
                    draft.isLoading = true;
                    break;
                }
                case types.SET_ERROR: {
                    Object.assign(draft, {
                        isLoading: false,
                        error: payload.error
                    });
                    break;
                }

                //Selection
                case types.SET_ACTIVE: {
                    if (!setActiveIndex(payload.index)) break;
                    draft.resetPivotForRelative = true;
                    break;
                }
                case types.SELECT: {
                    const { addToPrev, index } = payload;
                    if (!setActiveIndex(index)) break;

                    if (draft.resetPivotForRelative) {
                        draft.pivotIndex = state.activeIndex;
                        draft.resetPivotForRelative = false;
                    }

                    if (!addToPrev)
                        draft.selection.clear();

                    if (payload.isRange) {
                        if (addToPrev)
                            //Clear previous selection
                            setRangeSelected(state, false);

                        setRangeSelected(draft, true);
                        break;
                    }

                    draft.pivotIndex = index;

                    const value = getActiveValue();
                    const selected = !addToPrev || !draft.selection.has(value);
                    setValueSelected(value, selected);

                    break;
                }
                case types.CLEAR_SELECTION: {
                    clearSelection();
                    break;
                }
                case types.SET_SELECTED: {
                    if (!multiSelect) break;

                    //Active index
                    setActiveIndex(payload.activeIndex);

                    //Pivot index
                    const { pivotIndex } = payload;
                    if (isIndexValid(pivotIndex)) {
                        draft.pivotIndex = pivotIndex;
                        draft.resetPivotForRelative = false;
                    }

                    //Selection
                    const { map } = payload;
                    for (let value in map) {
                        value = validateValue(value, true);
                        if (value === null) continue;

                        setValueSelected(value, map[value]);
                    }

                    break;
                }
                case types.SELECT_ALL: {
                    setSelection(draft.rowValues);
                    break;
                }

                //Search
                case types.SEARCH: {
                    let { phrase } = payload;
                    Object.assign(draft, {
                        searchPhrase: phrase,
                        matches: [],
                        matchIndex: 0
                    });

                    if (!phrase) break;
                    phrase = options.searchValueParser(phrase);

                    addMatches(draft.searchIndex, phrase,  0);
                    const [value] = draft.matches.sort(compareItems);

                    setActiveValue(value, true, true);
                    draft.resetPivotForRelative = true;
                    break;
                }
                case types.GO_TO_MATCH: {
                    const { index } = payload;
                    const { matches } = draft;

                    if (!_.inRange(index, matches.length)) break;
                    setActiveValue(matches[index], index > draft.matchIndex);

                    draft.matchIndex = index;
                    draft.resetPivotForRelative = true;
                    break;
                }

                //Pagination
                case types.SET_PAGE_SIZE: {
                    const newSize = parseInt(payload.size);
                    //NaN >= x is false so doing the comparison in this way avoids an isNaN check
                    if (!(newSize >= 0)) break;

                    draft.pageSize = newSize;
                    setActiveIndex(state.activeIndex, true);
                    break;
                }
                default: {
                    break;
                }
            }
        });
    }
}
