import _ from "lodash";
import produce, {enableMapSet, original, current} from "immer";
import {types} from "../models/Actions";
import {setOptions} from "../utils/tableUtils";
import {compareAscending} from "../utils/sortUtils";
import {getSortedItemValues} from "../selectors/itemSelectors";

enableMapSet();

const nextSortOrder = Object.freeze({
    undefined: true,
    true: false,
    false: undefined
})

export const relativePos = Object.freeze({
    NEXT: 1,
    PREV: -1,
    FIRST: "first",
    LAST: "last"
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
        itemValues: null,
        sortedItems: {},
        headValue: undefined,
        tailValue: undefined,
        rows: [],
        visibleItemCount: 0,
        activeValue: null,
        pivotValue: null,
        virtualActiveValue: null,

        ...options.initState
    };

    let draft;


    //#region Ordering

    function _setItemOrder(first, second) {
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

    function _swapItemPositions(first, second) {
        if (first === second) return;

        const {
            [first]: { next: firstNext, prev: firstPrev },
            [second]: { next: secondNext, prev: secondPrev }
        } = draft.sortedItems

        _setItemOrder(firstPrev, second);
        _setItemOrder(first, secondNext);

        if (firstNext === second) {
            _setItemOrder(second, first);
        } else {
            _setItemOrder(second, firstNext);
            _setItemOrder(secondPrev, first);
        }
    }

    //#endregion

    //#region Visibility

    function _setItemVisibility(value, visibility) {
        const item = draft.sortedItems[value];
        if (!!item?.visible === visibility) return;

        item.visible = visibility;
        draft.visibleItemCount += visibility ? 1 : -1;
    }

    //#endregion

    //#region Sorting

    function _compareItemData(thisData, otherData, allowEqual = false) {
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

        if (allowEqual)
            return 0;

        return compareProperty(compareAscending, valueProperty) * factor;
    }

    function debugStateEqual(selector) {
        console.log(selector(original(draft)) === selector(current(draft)));
    }

    function getItemValues() {
        if (draft.itemValues)
            return draft.itemValues;

        const itemValues = [];
        let currentValue = draft.headValue;
        while (currentValue !== undefined) {
            itemValues.push(currentValue);
            currentValue = draft.sortedItems[currentValue].next;
        }

        return draft.itemValues = itemValues;
    }

    function sortNative() {
        const itemValues = getItemValues();

        itemValues.sort((valueA, valueB) => {
            const {
                [valueA]: { data: dataA },
                [valueB]: { data: dataB }
            } = draft.sortedItems;

            return _compareItemData(dataA, dataB);
        });

        let prevValue = undefined;
        for (let value of itemValues) {
            _setItemOrder(prevValue, value);
            prevValue = value;
        }

        _setItemOrder(prevValue, undefined);

        firstPage();
    }

    //#endregion

    //#region Querying

    function _findVisibleItem(callback, originValue, forwards, skipOrigin = false) {
        const nextProperty = forwards ? "next" : "prev";

        let currentValue = originValue;
        while (currentValue !== undefined) {
            const value = currentValue;
            const item = draft.sortedItems[value];
            currentValue = item[nextProperty];

            if (skipOrigin) {
                skipOrigin = false;
                continue;
            }

            if (!item.visible) continue;

            const result = callback(value, item);
            if (result !== undefined)
                return result;
        }

        return null;
    }

    function getRelativeVisibleValue(originValue, relPos) {
        if (!relPos) return;

        let forward;

        if (relPos === relativePos.FIRST) {
            originValue = draft.headValue
            forward = true;
        } else if (relPos === relativePos.LAST) {
            originValue = draft.tailValue
            forward = false;
        }

        if (forward === undefined)
            forward = relPos > 0
        else
            relPos = 0

        let distance = 0;
        const callback = (value, item) => {
            if (forward)
                _compareItemData(item.data, _.last(draft.rows)) > 0 && nextPage();
            else
                _compareItemData(item.data, draft.rows[0]) < 0 && prevPage();

            if (distance++ === Math.abs(relPos))
                return value;
        }

       return _findVisibleItem(callback, originValue, forward);
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

    function getMaxPageSize() {
        return draft.pageSize || draft.visibleItemCount;
    }

    function _paginateItems(originValue, forwards, skipOrigin) {
        const maxPageSize = getMaxPageSize();

        const isLastPage = !forwards && !skipOrigin
        const lastPageSize = draft.visibleItemCount % maxPageSize
        const pageSize = isLastPage && lastPageSize || maxPageSize;

        const indexOffset = forwards ? 1 : -1
        let currentIndex = forwards ? 0 : pageSize - 1
        let counter = 0;

        const callback = (value, item) => {
            draft.rows[currentIndex] = item.data;
            currentIndex += indexOffset

            //We can't use draft.rows.length for back-to-front case
            if (++counter === pageSize)
                return true;
        }

        _findVisibleItem(callback, originValue, forwards, skipOrigin)

        //Clear unused remaining rows (for last page)
        for (; counter < maxPageSize; counter++)
            delete draft.rows[counter]
    }

    function firstPage() {
        _paginateItems(draft.headValue, true, false)
        draft.pageIndex = 0
        resetActiveValue();
    }

    function lastPage() {
        _paginateItems(draft.tailValue, false, false)
        draft.pageIndex = getMaxPageIndex()
        resetActiveValue();
    }

    function nextPage() {
        if (draft.pageIndex === getMaxPageIndex()) return;

        _paginateItems(_.last(draft.rows)[valueProperty], true, true)
        draft.pageIndex++
        resetActiveValue();
    }

    function prevPage() {
        if (draft.pageIndex === 0) return;

        _paginateItems(draft.rows[0][valueProperty], false, true)
        draft.pageIndex--
        resetActiveValue();
    }

    //#endregion

    //#region Addition

    function _addItem(data, prev, next) {
        const value = data[valueProperty];

        //Reject if value is null or undefined
        if (value == null) return null;

        //Ensure visible item counter stays correct when replacing item
        _setItemVisibility(value, false);

        //Add or replace item
        const item = draft.sortedItems[value] = { data };

        //Set position
        _setItemOrder(prev, value);
        _setItemOrder(value, next);

        //Set visibility
        _setItemVisibility(value, options.itemPredicate(data, draft.filter));

        return item;
    }

    function _addRow(item) {
        //item will be null if it has invalid value
        if (!item?.visible) return;
        if (draft.rows.length >= getMaxPageSize()) return;

        draft.rows.push(item.data);
    }

    function addItems(data) {
        const firstRow = draft.rows[0]?.[valueProperty];
        draft.rows = [];
        draft.itemValues = null;

        let addToTable = false;

        let dataIndex = 0;
        let currentValue = draft.headValue;

        data.sort(_compareItemData);

        //In-place merge
        while (currentValue !== undefined && dataIndex < data.length) {
            const newData = data[dataIndex];

            if (currentValue === firstRow)
                addToTable = true;

            let currentItem = draft.sortedItems[currentValue];
            if (_compareItemData(newData, currentItem.data) < 0) {
                //New item is smaller
                currentItem = _addItem(newData, currentItem.prev, currentValue);
                dataIndex++;
            } else
                currentValue = currentItem.next;

            if (addToTable)
                _addRow(currentItem)
        }

        for (; dataIndex < data.length; dataIndex++)
            _addRow(_addItem(data[dataIndex], draft.tailValue));
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
            if (value === toValue) return true;
        }

        const forwards = _compareItemData(fromData, toData) < 0
        _findVisibleItem(callback, fromValue, forwards);
    }

    //#endregion

    //#region Debugging

    function debugInit() {

    }

    function debug() {

    }

    //#endregion


    //Utilities
    function getMaxPageIndex() {
        const count = selectors.getPageCount(draft) ?? 1;
        return count - 1;
    }

    function resetActiveValue() {
        setActiveValue(draft.rows[0][valueProperty])
    }

    function setActiveValue(value) {
        draft.activeValue = value;
        draft.virtualActiveValue = value;
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

        const nextState = produce(state, newDraft => {
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
                    const { items } = payload;
                    if (!items.length) break;

                    clearSelection();
                    addItems(items);
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

                    const { path } = payload;
                    const { sortAscending } = draft;

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
                    const value = getRelativeVisibleValue(draft.virtualActiveValue, payload.position);
                    if (value === null) break;

                    if (draft.virtualActiveValue !== draft.activeValue)
                        draft.pivotValue = draft.activeValue;

                    if (payload.ctrlKey && !payload.shiftKey) {
                        setActiveValue(value);
                        draft.pivotValue = value;
                        break;
                    }

                    payload.value = value;
                    //Deliberate fall-through
                }
                case types.SELECT: {
                    const value = validateValue(payload.value, true);
                    if (value === null) break;

                    setActiveValue(value);

                    if (!multiSelect) {
                        selectOnly(value);
                        break;
                    }

                    const { ctrlKey, shiftKey } = payload;

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
                        setActiveValue(setActive);

                    //Pivot value
                    const setPivot = validateValue(payload.pivot, true);
                    if (setPivot !== null)
                        draft.pivotValue = setPivot;

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

                    // if (!_.inRange(index, selectors.getPageCount(draft))) break;
                    //
                    // draft.pageIndex = index;
                    //
                    // draft.virtualActiveIndex = selectors.getActivePageIndex(draft) === index
                    //     ? draft.activeIndex
                    //     : selectors.getFirstVisibleIndex(draft);
                }
                default: {
                    break;
                }
            }
        });

        return nextState;
    }
}
