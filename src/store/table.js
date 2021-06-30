import _ from "lodash";
import produce, {current, enableMapSet, original} from "immer";
import {types} from "../models/Actions";
import {setOptions} from "../utils/tableUtils";
import {compareAscending} from "../utils/sortUtils";

enableMapSet();

const nextSortOrder = Object.freeze({
    undefined: true,
    true: false,
    false: undefined
})

export const relativePos = Object.freeze({
    NEXT: "next",
    PREV: "prev",
    FIRST: "first",
    LAST: "last"
})

export const specialValues = Object.freeze({
    FIRST_ITEM: "firstItem",
    LAST_ITEM: "lastItem",
    FIRST_ROW: "firstRow",
    LAST_ROW: "lastRow"
})

export default function createTable(namespace, options = {}) {
    const selectors = setOptions(namespace, options);

    const {
        valueProperty,
        listBox,
        multiSelect
    } = options;

    const initState = {
        selection: new Set(),
        activeIndex: 0, //Legacy
        pivotIndex: 0, //Legacy
        virtualActiveIndex: 0, //Legacy
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


    //#region Ordering

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

    //#endregion

    //#region Visibility

    function setItemVisibility(value, visibility) {
        const item = draft.sortedItems[value];
        if (!!item?.visible === visibility) return;

        item.visible = visibility;
        draft.visibleItemCount += visibility ? 1 : -1;
    }

    //#endregion

    //#region Sorting

    function compareItemData(thisData, otherData) {
        const compareProperty = (comparator, path) =>
            comparator(_.get(thisData, path), _.get(otherData, path));

        //Ensure that reversing the sort order of a column with all equal values, reverses the items
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

    function debugStateEqual(selector) {
        console.log(selector(original(draft)) === selector(current(draft)));
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

    const getFirstRowValue = () => draft.rows[0][valueProperty];
    const getLastRowValue = () => _.last(draft.rows)[valueProperty];

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
        const forward = relPos > 0 && !Object.is(relPos, -0);

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
        const count = selectors.getPageCount(draft) ?? 1;
        return count - 1;
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
        let doResetActive = true;

        let currentIndex = forwards ? 0 : pageSize - 1
        function callback(value, item) {
            draft.rows[currentIndex] = item.data;
            currentIndex += indexOffset;

            if (value === draft.activeValue)
                doResetActive = false;
        }

        findVisibleRelativeValue(callback, originValue, pageSize * indexOffset, skipOrigin);

        //Clear unused remaining rows (for last page)
        for (let i = pageSize; i < draft.pageSize; i++)
            delete draft.rows[i];

        if (doResetActive)
            resetActiveValue();
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

        draft.pageIndex++
        paginateItems(getLastRowValue(), true, true)
    }

    function prevPage() {
        if (draft.pageIndex === 0) return;

        draft.pageIndex--
        paginateItems(getFirstRowValue(), false, true)
    }

    //#endregion

    //#region Addition

    function addItem(data, prev, next) {
        const value = data[valueProperty];

        //Reject if value is null or undefined
        if (value == null) return null;

        //Ensure visible item counter stays accurate when replacing item
        setItemVisibility(value, false);

        //Add or replace item
        const item = draft.sortedItems[value] = { data };

        //Set position
        setItemOrder(prev, value);
        setItemOrder(value, next);

        //Set visibility
        setItemVisibility(value, options.itemPredicate(data, draft.filter));

        return item;
    }

    function addItems(data) {
        const { pageSize } = draft;
        let foundActive = false;
        let activeIndex = 0;
        let activePageIndex = -1;
        let activePageFirstValue;

        data.sort(compareItemData);

        let dataIndex = 0;
        let currentValue = draft.headValue;

        //In-place merge
        while (currentValue !== undefined && dataIndex < data.length) {
            const newData = data[dataIndex];

            let currentItem = draft.sortedItems[currentValue];
            if (compareItemData(newData, currentItem.data) < 0) {
                //New item is smaller
                currentItem = addItem(newData, currentItem.prev, currentValue);
                dataIndex++;
            } else
                currentValue = currentItem.next;

            //Find active page
            if (!currentItem.visible || !pageSize || foundActive) continue;

            const itemValue = currentItem.data[valueProperty];

            if (activeIndex++ % pageSize === 0) {
                activePageIndex++;
                activePageFirstValue = itemValue;
            }

            if (itemValue === draft.activeValue)
                foundActive = true;
        }

        for (; dataIndex < data.length; dataIndex++)
            addItem(data[dataIndex], draft.tailValue);

        if (foundActive) {
            draft.pageIndex = activePageIndex;
            paginateItems(activePageFirstValue, true, false);
        } else
            firstPage();
    }

    //#endregion

    //#region Selection

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

    //#endregion

    //#region Debugging

    function debugInit() {

    }

    function debug() {

    }

    //#endregion


    //Utilities

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

    return (state = initState, action) => {
        if (action.type === "@@INIT")
            return produce(state, newDraft => {
                draft = newDraft;
                debugInit();
            });

        if (action.namespace !== namespace)
            return state;

        return produce(state, newDraft => {
            draft = newDraft;

            const {payload} = action;

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
                    // const { values } = payload;
                    // if (!values.length) break;
                    //
                    // for (let value of values)
                    //     delete draft.items[value];
                    //
                    // setActiveIndex(draft.pivotIndex);
                    // clearSelection();
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
                }
                default: {
                    break;
                }
            }
        });
    }
}
