// noinspection StatementWithEmptyBodyJS

import _ from "lodash";
import produce, {enableMapSet} from "immer";
import {specialValues, relativePos, types} from "../models/Actions";
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
        getPageCount,
        isPageLast,
        getPageIndex,
        getActiveRowIndex
    } = _.mapValues(utils.private.selectors, selector =>
        (state = draft) => selector(state));

    const {
        valueProperty,
        searchProperty,
        listBox,
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
        pivotValue: null,
        resetPivotForRelative: false,

        ...options.initState
    };

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

        firstPage();
        clearSelection();
    }

    //#endregion

    //#region Querying

    function getDataValue(data) {
        return _.get(data, valueProperty);
    }

    function* createValueIterator(onlyVisible = false, forward = true, originValue = null) {
        originValue ??= draft.headValue;
        const nextProperty = forward ? "next" : "prev";

        let value = originValue;
        while (value !== undefined) {
            const item = draft.sortedItems[value];
            if (!onlyVisible || item.visible)
                yield value;

            value = item[nextProperty];
        }
    }

    function validateValue(value, checkVisible = false) {
        if (value == null) return null;

        const item = draft.sortedItems[value];

        if (!item) return null;
        if (checkVisible && !item.visible) return null;

        return getDataValue(item.data);
    }

    //#endregion

    //#region Pagination

    function getCurrentPageSize() {
        const {pageSize, visibleItemCount} = draft;

        if (!pageSize)
            return visibleItemCount;

        const lastPageSize = visibleItemCount % pageSize
        return isPageLast() && lastPageSize || pageSize;
    }

    function paginateItems(originValue, forward, skipOrigin) {
        draft.rowValues = [];

        const pageSize = getCurrentPageSize();
        const startIndex = forward ? 0 : pageSize - 1;
        const step = forward ? 1 : -1;
        let index = startIndex;

        const values = createValueIterator(true, forward, originValue);
        for (let value of values) {
            if (Math.abs(startIndex - index) >= pageSize) break;
            if (skipOrigin && value === originValue) continue;

            draft.rowValues[index] = value;
            index += step;
        }
    }

    function setPageIndex(pageIndex) {
        if (!_.inRange(pageIndex, 0, getPageCount())) return false;

        draft.activeIndex = draft.pageSize * pageIndex;
        return true;
    }

    function firstPage() {
        setPageIndex(0);
        paginateItems(draft.headValue, true, false);
    }

    function lastPage() {
        setPageIndex(getPageCount() - 1);
        paginateItems(draft.tailValue, false, false)
    }

    function nextPage() {
        if (!setPageIndex(getPageIndex() + 1)) return false;
        paginateItems(_.last(draft.rowValues), true, true);
        return true;
    }

    function prevPage() {
        if (!setPageIndex(getPageIndex() - 1)) return false;
        paginateItems(draft.rowValues[0], false, true)
        return true;
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

        draft.pivotValue = goToActiveValue();

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
            pivotValue: null,
            selection: new Set()
        });
    }

    //#endregion

    //#region Selection

    function nudgeActiveIndex(forward) {
        const nextIndex = draft.activeIndex + (forward ? 1 : -1);

        const rowIndex = getActiveRowIndex();
        const maxRowIndex = draft.rowValues.length - 1;

        let success = true;
        if (rowIndex === 0 && !forward)
            success = prevPage();
        else if (rowIndex === maxRowIndex && forward)
            success = nextPage();

        if (success)
            draft.activeIndex = nextIndex;

        return success;
    }

    function setActiveValue(value) {
        const originValue = getActiveValue();
        const activeValue = validateValue(value, true);
        if (activeValue == null) return originValue;

        const forward = draft.activeIndex === 0 || compareItems(activeValue, originValue) > 0;
        while (getActiveValue() !== activeValue && nudgeActiveIndex(forward));
        return activeValue;
    }

    function goToActiveValue() {
        const activeValue = getActiveValue();
        firstPage();
        return setActiveValue(activeValue);
    }

    function setActiveRowIndex(rowIndex) {
        if (!_.inRange(rowIndex, 0, draft.rowValues.length)) return false;

        draft.activeIndex = draft.pageSize * getPageIndex() + rowIndex;
        return true;
    }

    function setActiveSpecial(specialValue) {
        switch (specialValue) {
            case specialValues.FirstItem:
                firstPage();
                break;
            case specialValues.FirstRow:
                setActiveRowIndex(0);
                break;
            case specialValues.LastItem:
                lastPage();
                //Fallthrough
            case specialValues.LastRow:
                setActiveRowIndex(draft.rowValues.length - 1);
                break;
            default:
                break;
        }
    }

    function clearSelection() {
        draft.selection.clear();
        draft.pivotValue = getActiveValue();
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

    function setRangeSelected(fromValue, toValue, selected) {
        if (!multiSelect)
            return setValueSelected(selected ? toValue : fromValue, selected)

        const forward = compareItems(fromValue, toValue) < 0;
        const values = createValueIterator(true, forward, fromValue);

        for (let value of values) {
            setValueSelected(value, selected);
            if (value === toValue) break;
        }
    }

    //#endregion


    return (state = initState, action) => {
        if (action.namespace !== namespace)
            return state;

        return produce(state, newDraft => {
            draft = newDraft;

            const { payload } = action;

            // noinspection FallThroughInSwitchStatementJS
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

                    draft.pivotValue = setActiveValue(setActive);
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

                    if (!payload.shiftKey) {
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

                    firstPage();
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
                case types.SELECT_RELATIVE: {
                    const { offset } = payload;

                    setActiveSpecial(payload.origin);
                    const originValue = getActiveValue();

                    let distance = 0;
                    while (distance++ < Math.abs(offset) && nudgeActiveIndex(offset > 0));

                    if (payload.ctrlKey && !payload.shiftKey) {
                        draft.resetPivotForRelative = true;
                        break;
                    }

                    if (draft.resetPivotForRelative)
                        draft.pivotValue = originValue;

                    //Deliberate fall-through
                }
                case types.SELECT: {
                    const { ctrlKey, shiftKey } = payload;
                    if (payload.contextMenu && ctrlKey) break;

                    setActiveRowIndex(payload.rowIndex);

                    const prevActiveValue = getActiveValue(state);
                    const value = getActiveValue();

                    draft.resetPivotForRelative = false;

                    if (!ctrlKey)
                        draft.selection.clear();

                    if (shiftKey) {
                        if (ctrlKey)
                            //Clear previous selection
                            setRangeSelected(draft.pivotValue, prevActiveValue, false)

                        setRangeSelected(draft.pivotValue, value, true);
                        break;
                    }

                    draft.pivotValue = value;

                    const selected = !ctrlKey || !draft.selection.has(value);
                    setValueSelected(value, selected);

                    break;
                }
                case types.CLEAR_SELECTION: {
                    if (payload.ctrlKey || listBox) break;
                    clearSelection();
                    break;
                }
                case types.SET_SELECTED: {
                    if (!multiSelect) break;

                    //Active index
                    setActiveRowIndex(payload.activeRowIndex);

                    //Pivot value
                    const pivotValue = validateValue(payload.pivotValue, true);
                    if (pivotValue !== null) {
                        draft.pivotValue = pivotValue;
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
                    draft.matches.sort(compareItems);

                    firstPage();
                    //Fallthrough
                }
                case types.GO_TO_MATCH: {
                    const { index } = payload;
                    const { matches } = draft;

                    if (index !== undefined) {
                        if (!_.inRange(index, matches.length)) break;
                        draft.matchIndex = index;
                    }

                    setActiveValue(matches[draft.matchIndex]);
                    draft.resetPivotForRelative = true;
                    break;
                }

                //Pagination
                case types.SET_PAGE_SIZE: {
                    const newSize = parseInt(payload.size);
                    //NaN >= x is false so doing the comparison in this way avoids an isNaN check
                    if (!(newSize >= 0)) break;

                    draft.pageSize = newSize;
                    goToActiveValue();
                    break;
                }
                case types.GO_TO_PAGE_RELATIVE: {
                    switch (payload.position) {
                        case relativePos.Next:
                            nextPage();
                            break;
                        case relativePos.Prev:
                            prevPage();
                            break;
                        case relativePos.First:
                            firstPage();
                            break;
                        case relativePos.Last:
                            lastPage();
                            break;
                    }

                    draft.resetPivotForRelative = true;
                }
                default: {
                    break;
                }
            }
        });
    }
}
