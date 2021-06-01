import _ from "lodash";
import produce, {enableMapSet, original, current} from "immer";
import {types} from "../models/Actions";
import {setOptions} from "../utils/tableUtils";
import {compareAscending} from "../utils/sortUtils";

enableMapSet();

const nextSortOrder = Object.freeze({
    undefined: true,
    true: false,
    false: null
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
        sortAscending: {},
        sortCount: 0,
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
        activeValue: undefined,
        pivotValue: undefined,
        virtualActiveValue: undefined,

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
        if (!!item.visible === visibility) return;

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
        for (let path in draft.sortAscending) {
            factor = draft.sortAscending[path] ? 1 : -1

            const comparator = _.get(options.comparators, path, compareAscending);
            const result = compareProperty(comparator, path);

            if (!result) continue;

            return result * factor;
        }

        if (allowEqual)
            return 0;

        return compareProperty(compareAscending, valueProperty) * factor;
    }

    function _partitionItems(start, end) {
        const pivotItem =  draft.sortedItems[end];

        let boundary = start;
        let current = start;

        const swapBoundary = () => {
            _swapItemPositions(boundary, current);

            if (start === boundary)
                start = current;
        }

        while (current !== end) {
            const currentItem = draft.sortedItems[current];
            const next = currentItem.next;

            if (_compareItemData(currentItem.data, pivotItem.data) < 0) {
                const boundaryItem = draft.sortedItems[boundary];
                const nextBoundary = boundaryItem.next;
                swapBoundary();
                boundary = nextBoundary;
            }

            current = next;
        }

        swapBoundary();
        end = boundary;

        return {
            pivotItem,
            start, end
        };
    }

    function _sortItems(start, end) {
        if (start === end) return;

        const updated = _partitionItems(...arguments);
        const {prev, next} = updated.pivotItem;

        if (updated.start !== end)
            _sortItems(updated.start, prev);

        if (updated.end !== end)
            _sortItems(next, updated.end);
    }

    function sortItems() {
        _sortItems(draft.headValue, draft.tailValue);
        firstPage()
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
    }

    function _getRelativeVisibleValue(originValue, relPos) {
        if (!relPos) return originValue;

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
        const callback = value => {
            if (distance++ === Math.abs(relPos))
                return value;
        }

       return _findVisibleItem(callback, originValue, forward);
    }

    //#endregion

    //#region Pagination

    function _paginateItems(originValue, forwards, skipOrigin) {
        const isLastPage = !forwards && !skipOrigin
        const lastPageSize = draft.visibleItemCount % draft.pageSize
        const pageSize = isLastPage && lastPageSize || draft.pageSize;

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
        for (; counter < draft.pageSize; counter++)
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
        const item = draft.sortedItems[value] = { data };

        _setItemOrder(prev, value);
        _setItemOrder(value, next);

        _setItemVisibility(value, options.itemPredicate(data, draft.filter));

        return item;
    }

    function addItems(data) {
        const firstRow = draft.rows[0]?.[valueProperty];
        draft.rows = [];

        function addRow(item) {
            if (draft.rows.length >= draft.pageSize) return;
            if (!item.visible) return;

            draft.rows.push(item.data);
        }

        let addToTable = false;

        let dataIndex = 0;
        let current = draft.headValue;

        data.sort(_compareItemData);

        //In-place merge
        while (current !== undefined && dataIndex < data.length) {
            const newData = data[dataIndex];
            let currentItem = draft.sortedItems[current];

            if (current === firstRow)
                addToTable = true;

            if (_compareItemData(newData, currentItem.data) < 0) {
                //New item is smaller
                currentItem = _addItem(newData, currentItem.prev, current);
                dataIndex++;
            } else
                current = currentItem.next;

            if (addToTable)
                addRow(currentItem)
        }

        for (; dataIndex < data.length; dataIndex++)
            addRow(_addItem(data[dataIndex], draft.tailValue));
    }

    //#endregion

    //#region Selection

    function setRangeSelected(fromValue, toValue, selected) {
        const {
            [fromValue]: { data: fromData },
            [toValue]: { data: toData }
        } = draft.sortedItems

        const callback = value => {
            _.setToggleValue(draft.selection, value, selected);

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
        return selectors.getPageCount(draft) - 1
    }

    function setActiveIndex(index) {
        draft.activeIndex = index;
        draft.virtualActiveIndex = index;

        draft.searchLetter = null;
    }

    function resetActiveValue() {
        setActiveIndex(draft.rows[0][valueProperty])
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

    function parseValue(value) {
        return draft.sortedItems[value].data[valueProperty];
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

        setActiveValue(undefined);
        clearSelection();
    }

    return (state = initState, action) => {
        console.clear();

        if (action.type === "@@INIT")
            return produce(state, newDraft => {
                draft = newDraft;
                debugInit();
            });

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

                    const { path, shiftKey } = payload;

                    let next = nextSortOrder[state.sortAscending[path]];
                    if (!shiftKey) {
                        draft.sortAscending = {};
                        next ??= true;
                    }

                    if (next === null)
                        delete draft.sortAscending[path];
                    else
                        draft.sortAscending[path] = next;

                    sortItems();

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
                    const value = _getRelativeVisibleValue(draft.virtualActiveValue, payload.position);

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
                    const { value, ctrlKey, shiftKey } = payload;

                    const item = draft.sortedItems[value];
                    if (!item?.visible) break;

                    setActiveValue(value);

                    if (!multiSelect) {
                        selectOnly(value);
                        break;
                    }

                    const { selection } = draft;

                    if (!ctrlKey)
                        selection.clear();

                    if (shiftKey) {
                        if (ctrlKey)
                            //Clear previous selection
                            setRangeSelected(draft.pivotValue, original(draft).activeValue, false)

                        setRangeSelected(draft.pivotValue, value, true);
                        break;
                    }

                    draft.pivotValue = value;

                    const selected = !ctrlKey || !selection.has(value);
                    _.setToggleValue(selection, value, selected);

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
                    // //Active index
                    // const setActive = parseIndex(payload.active);
                    // if (setActive !== null)
                    //     setActiveIndex(setActive);
                    //
                    // //Pivot index
                    // const setPivot = parseIndex(payload.pivot);
                    // if (setPivot !== null)
                    //     draft.pivotIndex = setPivot;
                    //
                    // //Selection
                    // _.forEach(payload.map, (selected, index) => {
                    //     index = parseIndex(index);
                    //     if (index === null) return;
                    //
                    //     const value = selectors.getSortedValues(state)[index];
                    //     _.setToggleValue(draft.selection, value, selected);
                    // });
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
                    // const newSize = parseInt(payload.size);
                    // //NaN >= x is false so doing the comparison in this way avoids an isNaN check
                    // if (!(newSize >= 0)) break;
                    //
                    // draft.pageSize = newSize;
                    // setActiveIndex(draft.activeIndex); //Go to the active page
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
    }
}
