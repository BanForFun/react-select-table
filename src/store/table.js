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
    Next: "next",
    Prev: "prev",
    First: "first",
    Last: "last"
});

export const specialValues = Object.freeze({
    FirstItem: "firstItem",
    LastItem: "lastItem",
    FirstRow: "firstRow",
    LastRow: "lastRow"
});

export default function createTable(namespace, options = {}) {
    const {
        getDataValue
    } = setOptions(namespace, options);

    const {
        valueProperty,
        // listBox,
        multiSelect
    } = options;

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
        pageChangedSincePivotSet: false,

        ...options.initState
    };

    let draft;

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

    function compareItemData(thisData, otherData) {
        const compareProperty = (comparator, path) =>
            comparator(_.get(thisData, path), _.get(otherData, path));

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
        const itemValues = [...createValueIterator()];

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

        firstPage(true);
    }

    //#endregion

    //#region Querying

    function getFirstRowValue() {
        return getDataValue(draft.rows[0]);
    }

    function getLastRowValue() {
        const pageSize = getCurrentPageSize();
        return getDataValue(draft.rows[pageSize - 1]);
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

    function findVisibleRelativeValue(callback, originValue, relPos, skipOrigin = false) {
        //Not equal to >= 0 as we need to differentiate -0 and +0
        const forward = relPos > 0 || Object.is(relPos, 0);
        const values = createValueIterator(true, forward, originValue);

        let distance = 0;
        for (let value of values) {
            const reachedTarget = distance++ === Math.abs(relPos);

            if ((value !== originValue || !skipOrigin) && (!reachedTarget || skipOrigin))
                //Callback will be called exactly abs(relPos) times, regardless of skipOrigin
                callback(value);

            if (reachedTarget) return value;
        }

        return null;
    }

    function getRelativeVisibleValue(specialValue, relPos) {
        let originValue;
        switch (specialValue) {
            case specialValues.FirstRow:
                originValue = getFirstRowValue();
                break;
            case specialValues.LastRow:
                originValue = getLastRowValue();
                break;
            case specialValues.FirstItem:
                originValue = draft.headValue;
                firstPage();
                break;
            case specialValues.LastItem:
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

        return getDataValue(item.data);
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

        let currentIndex = forwards ? 0 : pageSize - 1;
        function callback(value) {
            draft.rows[currentIndex] = draft.sortedItems[value].data;
            currentIndex += indexOffset;
        }

        findVisibleRelativeValue(callback, originValue, pageSize * indexOffset, skipOrigin);

        //Clear unused remaining rows (for last page)
        for (let i = pageSize; i < draft.pageSize; i++)
            delete draft.rows[i];
    }

    function firstPage(resetSelection = false) {
        draft.pageIndex = 0
        paginateItems(draft.headValue, true, false);

        if (resetSelection) {
            draft.activeValue = getFirstRowValue();
            clearSelection();
        }
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

    function goToActivePage() {
        const setActive = startSetActiveTransaction(value => value === draft.activeValue);
        const values = createValueIterator(true);

        for (let value of values) {
            if (setActive.registerItem(value)) break;
        }

        setActive.commit();
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

        return value;
    }

    function addItems(itemData) {
        for (let data of itemData.sort(compareItemData))
            deleteItem(getDataValue(data), true);

        const setActive = startSetActiveTransaction(value => value === draft.activeValue);
        const addedValues = [];

        const values = createValueIterator();

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

            setActive.registerItem(value);
        }

        for (; dataIndex < itemData.length; dataIndex++)
            addedValues.push(addItem(itemData[dataIndex], draft.tailValue));

        setActive.commit();

        return addedValues;
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
            error: null,
            activeValue: null
        });

        clearSelection();
    }

    //#endregion

    //#region Selection

    function setPivotValue(value) {
        draft.pivotValue = value;
        draft.pageChangedSincePivotSet = false;
    }

    function resetPivotValue() {
        setPivotValue(draft.activeValue);
    }

    function clearSelection() {
        draft.selection.clear();
        resetPivotValue();
    }

    function setSelection(values) {
        clearSelection();
        for (let value of values)
            draft.selection.add(value);
    }

    function setSelectionSingle(value) {
        clearSelection();
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

        const forward = compareItemData(fromData, toData) < 0;
        const values = createValueIterator(true, forward, fromValue);

        for (let value of values) {
            setValueSelected(value, selected);
            if (value === toValue) break;
        }
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
                paginateItems(firstRowValue, true, false);
            } else {
                firstPage();
                itemValue = getFirstRowValue();
            }

            draft.activeValue = itemValue;
            resetPivotValue();
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
            const metadata = {};

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

                    setSelection(addItems(items));
                    break;
                }
                case types.DELETE_ITEMS: {
                    const valuesToDelete = new Set(payload.values);
                    if (!valuesToDelete.size) break;

                    const setActive = startSetActiveTransaction(
                        value => valuesToDelete.has(value), true);

                    const values = createValueIterator(true);
                    for (let value of values) {
                        if (!setActive.registerItem(value)) continue;
                        if (!valuesToDelete.has(value)) continue;

                        deleteItem(value);
                    }

                    setActive.commit();
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

                        //Don't bother with the pivot, it will be overwritten by addItems
                        if (draft.activeValue === oldValue)
                            draft.activeValue = newValue;

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

                    firstPage(true);
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
                    const value = getRelativeVisibleValue(payload.origin, payload.offset);
                    if (value === null) break;

                    if (draft.pageChangedSincePivotSet)
                        resetPivotValue();

                    draft.activeValue = value;

                    if (payload.ctrlKey && !payload.shiftKey) {
                        resetPivotValue();
                        break;
                    }

                    metadata.value = value;
                    //Deliberate fall-through
                }
                case types.SELECT: {
                    let { value } = metadata;

                    if (value === undefined) {
                        value = validateValue(payload.value, true);
                        if (value === null) break;

                        draft.activeValue = value;
                    }

                    if (!multiSelect) {
                        setSelectionSingle(value);
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

                    resetPivotValue();

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
                        setPivotValue(setPivot);

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
                    setSelection(_.map(draft.rows, valueProperty));
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
                    goToActivePage();
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

                    draft.activeValue = getFirstRowValue();
                    draft.pageChangedSincePivotSet = true;
                }
                default: {
                    break;
                }
            }
        });
    }
}
