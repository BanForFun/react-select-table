import _ from "lodash";
import produce, {current, enableMapSet, original} from "immer";
import {types} from "../models/Actions";
import {setOptions} from "../utils/tableUtils";
import {compareAscending} from "../utils/sortUtils";
import {getPageCount} from "../selectors/paginationSelectors";

enableMapSet();

const nextSortOrder = Object.freeze({
    undefined: true,
    true: false,
    false: undefined
});

export const relativePos = Object.freeze({
    NEXT: "next",
    PREV: "prev",
    FIRST: "first",
    LAST: "last"
});

export const specialValues = Object.freeze({
    FIRST_ITEM: "firstItem",
    LAST_ITEM: "lastItem",
    FIRST_ROW: "firstRow",
    LAST_ROW: "lastRow"
});

export default function createTable(namespace, options = {}) {
    const {
        valueProperty,
        // listBox,
        multiSelect
    } = setOptions(namespace, options);

    const initState = {
        selection: new Set(),
        filter: null,
        sortAscending: new Map(),
        isLoading: false,
        pageSize: 0,
        pageIndex: 0,
        error: null,
        searchLetter: null, //Legacy
        matchIndex: 0, //Legacy
        items: {},
        sortedItems: {},
        headValue: undefined,
        tailValue: undefined,
        rows: [],
        visibleItemCount: 0,
        activeValue: null,
        pivotValue: null,

        ...options.initState
    };

    let draft;

    //#region Visibility

    function setItemVisibility(value, visibility = null) {
        const item = draft.sortedItems[value];
        visibility ??= options.itemPredicate(item.data, draft.filter);

        if (!!item.visible === visibility) return;
        item.visible = visibility;
        draft.visibleItemCount += visibility ? 1 : -1;
    }

    //#endregion

    //#region Sorting

    function compareItemData(thisData, otherData) {
        const compareProperty = (comparator, path) =>
            comparator(_.get(thisData, path), _.get(otherData, path));

        //Make it so that reversing the sort order of a column with all equal values, reverses the item order
        let factor = 1;
        for (let [path, ascending] of draft.sortAscending) {
            factor = ascending ? 1 : -1

            const comparator = _.get(options.comparators, path, compareAscending);
            const result = compareProperty(comparator, path);

            if (!result) continue;

            return result * factor;
        }

        return compareProperty(compareAscending, valueProperty) * factor;
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

    function getItemValues() {
        const itemValues = [];
        let currentValue = draft.headValue;
        while (currentValue !== undefined) {
            itemValues.push(currentValue);
            currentValue = draft.sortedItems[currentValue].next;
        }

        return itemValues;
    }

    function sortNative() {
        const itemValues = getItemValues();

        itemValues.sort((valueA, valueB) => {
            const {
                [valueA]: { data: dataA },
                [valueB]: { data: dataB }
            } = draft.sortedItems;

            return compareItemData(dataA, dataB);
        });

        let prevValue = undefined;
        for (let value of itemValues) {
            setItemOrder(prevValue, value);
            prevValue = value;
        }

        setItemOrder(prevValue, undefined);

        firstPage();
    }

    //#endregion

    //#region Querying

    function getFirstRowValue() {
        return draft.rows[0][valueProperty];
    }

    function getLastRowValue() {
        const pageSize = getCurrentPageSize();
        return draft.rows[pageSize - 1][valueProperty];
    }

    function findVisibleValue(callback, originValue, forward) {
        const nextProperty = forward ? "next" : "prev";

        let currentValue = originValue;
        while (currentValue !== undefined) {
            const value = currentValue;
            const item = draft.sortedItems[value];
            currentValue = item[nextProperty];

            if (!item.visible) continue;

            if (callback(value, item)) return value;
        }

        return null;
    }

    function findVisibleRelativeValue(callback, originValue, relPos, skipOrigin = false) {
        //Not equal to >= 0 as we need to differentiate -0 and +0
        const forward = relPos > 0 || Object.is(relPos, 0);

        let distance = 0;
        function _callback(value, item) {
            const reachedTarget = distance++ === Math.abs(relPos);

            if ((value !== originValue || !skipOrigin) && (!reachedTarget || skipOrigin))
                //Callback will be called exactly abs(relPos) times, regardless of skipOrigin
                callback(value, item);

            return reachedTarget;
        }

        return findVisibleValue(_callback, originValue, forward);
    }

    function getRelativeVisibleValue(specialValue, relPos) {
        let originValue;
        switch (specialValue) {
            case specialValues.FIRST_ROW:
                originValue = getFirstRowValue();
                break;
            case specialValues.LAST_ROW:
                originValue = getLastRowValue();
                break;
            case specialValues.FIRST_ITEM:
                originValue = draft.headValue;
                firstPage();
                break;
            case specialValues.LAST_ITEM:
                originValue = draft.tailValue;
                lastPage();
                break;
            default:
                originValue = draft.activeValue;
                break;
        }

        const forward = relPos > 0;
        function callback(value) {
            if (forward && value === getLastRowValue())
                nextPage();
            else if (!forward && value === getFirstRowValue())
                prevPage();
        }

       return findVisibleRelativeValue(callback, originValue, relPos);
    }

    function validateValue(value, checkVisible = false) {
        if (value == null) return null;

        const item = draft.sortedItems[value];

        if (!item) return null;
        if (checkVisible && !item.visible) return null;

        return item.data[valueProperty];
    }

    //#endregion

    //#region Pagination

    function getMaxPageIndex() {
        return getPageCount(draft) - 1;
    }

    function getCurrentPageSize() {
        const {pageSize, visibleItemCount} = draft;

        if (!pageSize)
            return visibleItemCount;

        const lastPageSize = visibleItemCount % pageSize
        const isLastPage = draft.pageIndex === getMaxPageIndex();
        return isLastPage && lastPageSize || pageSize;
    }

    function paginateItems(originValue, forwards, skipOrigin) {
        const pageSize = getCurrentPageSize();
        const indexOffset = forwards ? 1 : -1;

        let currentIndex = forwards ? 0 : pageSize - 1
        function callback(value, item) {
            draft.rows[currentIndex] = item.data;
            currentIndex += indexOffset;
        }

        findVisibleRelativeValue(callback, originValue, pageSize * indexOffset, skipOrigin);

        //Clear unused remaining rows (for last page)
        for (let i = pageSize; i < draft.pageSize; i++)
            delete draft.rows[i];
    }

    function firstPage() {
        draft.pageIndex = 0
        paginateItems(draft.headValue, true, false)
    }

    function lastPage() {
        draft.pageIndex = getMaxPageIndex();
        paginateItems(draft.tailValue, false, false)
    }

    function nextPage() {
        if (draft.pageIndex === getMaxPageIndex()) return;
        //Get last row value before incrementing page index, because getLastRowValue calls getCurrentPageSize
        //which will return wrong size if next page is the last one
        const lastRowValue = getLastRowValue();

        draft.pageIndex++
        paginateItems(lastRowValue, true, true)
    }

    function prevPage() {
        if (draft.pageIndex === 0) return;
        const firstRowValue = getFirstRowValue();

        draft.pageIndex--
        paginateItems(firstRowValue, false, true)
    }

    //#endregion

    //#region Addition

    function addItem(data, prev, next) {
        //Reject if value is null or undefined
        const value = data[valueProperty];
        if (value == null) return null;

        //Add item
        draft.sortedItems[value] = { data };

        //Set position
        setItemOrder(prev, value);
        setItemOrder(value, next);

        //Set visibility
        setItemVisibility(value);

        return value;
    }

    function addItems(itemData) {
        const setActive = startSetActiveTransaction(value => value === draft.activeValue);

        for (let i = 0; i < itemData.length; i++) {
            itemData[i] = options.itemParser(itemData[i]);
            deleteItem(itemData[i][valueProperty], true);
        }

        itemData.sort(compareItemData);

        let dataIndex = 0;
        let currentValue = draft.headValue;

        //In-place merge
        while (currentValue !== undefined && dataIndex < itemData.length) {
            const data = itemData[dataIndex];
            const item = draft.sortedItems[currentValue];

            let value;
            if (compareItemData(data, item.data) < 0) {
                value = addItem(data, item.prev, currentValue);
                dataIndex++;
            } else {
                value = currentValue;
                currentValue = item.next;
            }

            setActive.registerItem(value);
        }

        for (; dataIndex < itemData.length; dataIndex++)
            addItem(itemData[dataIndex], draft.tailValue);

        setActive.commit();
    }

    //#endregion

    //#region Deletion

    function deleteItem(value, toBeReplaced = false) {
        const item = draft.sortedItems[value];
        if (!item) return;

        setItemVisibility(value, false);
        setItemOrder(item.prev, item.next);

        if (toBeReplaced) return;
        delete draft.sortedItems[value];
        draft.selection.delete(value);
    }

    function clearItems() {
        Object.assign(draft, {
            headValue: undefined,
            tailValue: undefined,
            visibleItemCount: 0,
            pageIndex: 0,
            rows: [],
            sortedItems: {},
            isLoading: false,
            error: null
        });

        setActiveValue(null);
        clearSelection();
    }

    //#endregion

    //#region Selection

    function resetActiveValue() {
        setActiveValue(draft.rows[0][valueProperty]);
    }

    function setActiveValue(value) {
        draft.activeValue = value;
        draft.pivotValue = value;
    }

    function clearSelection() {
        draft.selection.clear();
        draft.pivotValue = draft.activeValue;
    }

    function selectOnly(value) {
        draft.selection.clear();
        draft.selection.add(value);
    }

    function setValueSelected(value, selected) {
        if (selected)
            draft.selection.add(value);
        else
            draft.selection.delete(value);
    }

    function setRangeSelected(fromValue, toValue, selected) {
        const {
            [fromValue]: { data: fromData },
            [toValue]: { data: toData }
        } = draft.sortedItems

        const callback = value => {
            setValueSelected(value, selected);
            return value === toValue;
        }

        const forward = compareItemData(fromData, toData) < 0
        findVisibleValue(callback, fromValue, forward);
    }

    function startSetActiveTransaction(predicate, setPrevious = false) {
        let found = false;
        let itemIndex = -1, pageIndex = -1;
        let itemValue, firstRowValue;

        function registerItem(value) {
            const item = draft.sortedItems[value];
            if (found || !item.visible) return found;

            if (predicate(value)) {
                found = true;
                if (setPrevious) return true;
            }

            itemValue = value;
            itemIndex++;

            //Checking for !itemIndex, because we need the code to run for the first item even if pageSize is zero
            if (!itemIndex || itemIndex % draft.pageSize === 0) {
                pageIndex++;
                firstRowValue = value;
            }

            return found;
        }

        function commit() {
            if (found && pageIndex >= 0) {
                draft.pageIndex = pageIndex;
                setActiveValue(itemValue);
                paginateItems(firstRowValue, true, false);
            } else {
                firstPage();
                resetActiveValue();
            }
        }

        return { registerItem, commit };
    }

    //#endregion

    //#region Debugging

    // noinspection JSUnusedLocalSymbols
    function debugStateEqual(selector) {
        console.log(selector(original(draft)) === selector(current(draft)));
    }

    function debug() {

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
                case types.DEBUG: {
                    debug();
                    break;
                }

                //Items
                case types.SET_ITEMS: {
                    clearItems();
                    addItems(payload.items);
                    break;
                }
                case types.ADD_ITEMS: {
                    const {items} = payload;
                    if (!items.length) break;

                    addItems(items);

                    clearSelection();
                    items.forEach(item => draft.selection.add(item[valueProperty]));

                    break;
                }
                case types.DELETE_ITEMS: {
                    const values = new Set(payload.values);
                    if (!values.size) break;

                    const setActive = startSetActiveTransaction(
                        value => values.has(value), true);

                    let currentValue = draft.headValue;
                    while (currentValue !== undefined) {
                        const value = currentValue;
                        currentValue = draft.sortedItems[value].next;

                        if (!setActive.registerItem(value)) continue;

                        if (values.has(value))
                            deleteItem(value);
                    }

                    setActive.commit();
                    break;
                }
                case types.SET_ITEM_VALUES: {
                    // _.forEach(payload.map, (newValue, oldValue) => {
                    //     oldValue = parseValue(oldValue);
                    //     if (oldValue === newValue) return;
                    //
                    //     //Update selection
                    //     _.setReplaceValue(draft.selection, oldValue, newValue);
                    //
                    //     //Create new item
                    //     const newItem = draft.items[oldValue];
                    //     newItem[valueProperty] = newValue;
                    //     draft.items[newValue] = newItem;
                    //
                    //     //Delete old item
                    //     delete draft.items[oldValue];
                    // });

                    break;
                }
                case types.PATCH_ITEMS: {
                    // clearSelection();
                    // for (let patch of payload.patches)
                    //     Object.assign(draft.items[patch[valueProperty]], patch);
                    break;
                }
                case types.SORT_ITEMS: {
                    clearSelection();

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
                    // setActiveIndex(0);
                    // clearSelection();
                    //
                    // draft.filter = payload.filter;
                    break;
                }
                case types.CLEAR_ITEMS: {
                    // setItems([]);
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
                    const value = getRelativeVisibleValue(payload.origin, payload.offset);
                    if (value === null) break;

                    if (payload.ctrlKey && !payload.shiftKey) {
                        setActiveValue(value);
                        break;
                    }

                    payload.value = value;
                    //Deliberate fall-through
                }
                case types.SELECT: {
                    const value = validateValue(payload.value, true);
                    if (value === null) break;

                    draft.activeValue = value;

                    if (!multiSelect) {
                        selectOnly(value);
                        break;
                    }

                    const {ctrlKey, shiftKey} = payload;

                    if (!ctrlKey)
                        draft.selection.clear();

                    if (shiftKey) {
                        if (ctrlKey)
                            //Clear previous selection
                            setRangeSelected(draft.pivotValue, original(draft).activeValue, false)

                        setRangeSelected(draft.pivotValue, value, true);
                        break;
                    }

                    draft.pivotValue = value;

                    const selected = !ctrlKey || !draft.selection.has(value);
                    setValueSelected(value, selected);

                    break;
                }
                case types.CONTEXT_MENU: {
                    //Should still be dispatched for middleware
                    // if (payload.ctrlKey) break;
                    //
                    // const index = parseIndex(payload.index);
                    // if (index === null) {
                    //     if (!listBox) clearSelection();
                    //     break;
                    // }
                    //
                    // setActiveIndex(index);
                    //
                    // if (listBox) break;
                    //
                    // const value = selectors.getSortedValues(state)[index];
                    // if (draft.selection.has(value)) break;
                    //
                    // selectOnly(value);
                    break;
                }
                case types.CLEAR_SELECTION: {
                    clearSelection();
                    break;
                }
                case types.SET_SELECTED: {
                    //Active value
                    const setActive = validateValue(payload.active, true);
                    if (setActive !== null)
                        draft.activeValue = setActive;

                    //Pivot value
                    const setPivot = validateValue(payload.pivot, true);
                    if (setPivot !== null)
                        draft.pivotValue = setPivot;

                    //Selection
                    const {map} = payload;
                    for (let value in map) {
                        value = validateValue(value, true);
                        if (value === null) continue;

                        setValueSelected(value, map[value]);
                    }

                    break;
                }
                case types.SELECT_ALL: {
                    draft.selection.clear();
                    _.setAddMany(draft.selection, _.map(draft.rows, valueProperty))
                    break;
                }
                case types.SEARCH: {
                    // const letter = payload.letter.toLowerCase();
                    // const matches = selectors.getSearchIndex(state)[letter];
                    // if (!matches) break;
                    //
                    // //Find item index
                    // const nextIndex = draft.matchIndex + 1;
                    // const matchIndex = letter === draft.searchLetter && nextIndex < matches.length ? nextIndex : 0;
                    // const itemIndex = matches[matchIndex];
                    //
                    // //Select item
                    // setActiveIndex(itemIndex);
                    // selectOnly(selectors.getSortedValues(state)[itemIndex]);
                    //
                    // draft.searchLetter = letter;
                    // draft.matchIndex = matchIndex;
                    break;
                }

                //Pagination
                case types.SET_PAGE_SIZE: {
                    const newSize = parseInt(payload.size);
                    //NaN >= x is false so doing the comparison in this way avoids an isNaN check
                    if (!(newSize >= 0)) break;

                    draft.pageSize = newSize;
                    draft.rows = [];
                    firstPage();
                    break;
                }
                case types.GO_TO_PAGE_RELATIVE: {
                    switch (payload.position) {
                        case relativePos.NEXT:
                            nextPage();
                            break;
                        case relativePos.PREV:
                            prevPage();
                            break;
                        case relativePos.FIRST:
                            firstPage();
                            break;
                        case relativePos.LAST:
                            lastPage();
                            break;
                    }

                    resetActiveValue();
                }
                default: {
                    break;
                }
            }
        });
    }
}
