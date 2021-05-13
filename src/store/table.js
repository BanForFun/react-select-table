import _ from "lodash";
import produce, {enableMapSet, original, current} from "immer";
import {types} from "../models/Actions";
import {setOptions} from "../utils/tableUtils";
import {compareAscending} from "../utils/sortUtils";

enableMapSet();

const nextSortOrder = {
    undefined: true,
    true: false,
    false: null
}

export default function createTable(namespace, options = {}) {
    const selectors = setOptions(namespace, options);

    const {
        valueProperty,
        listBox,
        multiSelect
    } = options;

    const initState = {
        selection: new Set(),
        activeIndex: 0,
        pivotIndex: 0,
        virtualActiveIndex: 0,
        filter: null,
        sortAscending: {},
        sortCount: 0,
        isLoading: false,
        pageSize: 0,
        pageIndex: 0,
        error: null,
        searchLetter: null,
        matchIndex: 0,
        items: {},
        sortedItems: {},
        headValue: undefined,
        tailValue: undefined,
        tableItems: [],
        visibleItemCount: 0,

        ...options.initState
    };

    let draft;

    //#region Item utils

    const getNextVisibleItem = value =>
        _getVisibleItem(value, item => item.next);

    const getPrevVisibleItem = value =>
        _getVisibleItem(value, item => item.prev);

    function _setItemOrder(first, second) {
        const secondItem = getItem(second)
        if (secondItem)
            secondItem.prev = first;
        else
            draft.tailValue = first;

        const firstItem = getItem(first)
        if (firstItem)
            firstItem.next = second;
        else
            draft.headValue = second;
    }

    function _setItemVisibility(value, visibility) {
        const item = getItem(value);
        if (!!item.visible === visibility) return;

        item.visible = visibility;
        draft.visibleItemCount += visibility ? 1 : -1;
    }

    function _swapItemPositions(first, second) {
        if (first === second) return;

        const { next: firstNext, prev: firstPrev } = getItem(first);
        const { next: secondNext, prev: secondPrev } = getItem(second);

        _setItemOrder(firstPrev, second);
        _setItemOrder(first, secondNext);

        if (firstNext === second) {
            _setItemOrder(second, first);
        } else {
            _setItemOrder(second, firstNext);
            _setItemOrder(secondPrev, first);
        }
    }

    function _compareItemData(data, other, allowEqual = false) {
        const compareProperty = (comparator, path) =>
            comparator(_.get(data, path), _.get(other, path));

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
        const pivotItem = getItem(end);

        let boundary = start;
        let current = start;

        const swapBoundary = () => {
            _swapItemPositions(boundary, current);

            if (start === boundary)
                start = current;
        }

        while (current !== end) {
            const currentItem = getItem(current);
            const next = currentItem.next;

            if (_compareItemData(currentItem.data, pivotItem.data) < 0) {
                const boundaryItem = getItem(boundary);
                const nextBoundary = boundaryItem.next;
                swapBoundary();
                boundary = nextBoundary;
            }

            current = next;
        }

        swapBoundary();
        end = boundary;

        return {
            //Add startIndex and boundaryIndex
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

    function _getVisibleItem(value, getNextValue) {
        let item = getItem(value);

        do {
            item = getItem(getNextValue(item));
        } while (item && !item.visible)

        return item;
    }

    function sortItems() {
        _sortItems(draft.headValue, draft.tailValue);
    }

    function addItem(data, prev, next) {
        const value = data[valueProperty];
        const item = draft.sortedItems[value] = { data };

        _setItemOrder(prev, value);
        _setItemOrder(value, next);

        _setItemVisibility(value, options.itemPredicate(data, draft.filter));

        return item;
    }

    function getItem(value) {
        if (value === undefined) return null;
        return draft.sortedItems[value];
    }

    function addItems(data) {
        data.sort(_compareItemData);

        let addToTable = false;

        const addTableItem = item => {
            if (!addToTable) return;
            if (!item.visible) return;
            if (draft.tableItems.length >= draft.pageSize) return;

            draft.tableItems.push(item.data);
        }

        let dataIndex = 0;
        let current = draft.headValue;

        const startValue = draft.tableItems[0]?.[valueProperty];
        draft.tableItems = [];

        //In-place merge
        while (current !== undefined && dataIndex < data.length) {
            const newData = data[dataIndex];
            const currentItem = getItem(current);

            if (current === startValue)
                addToTable = true;

            if (_compareItemData(newData, currentItem.data) < 0) {
                //New item is smaller
                addTableItem(addItem(newData, currentItem.prev, current));
                dataIndex++;
            } else {
                addTableItem(currentItem);
                current = currentItem.next;
            }
        }

        addToTable = true;

        for (; dataIndex < data.length; dataIndex++)
            addTableItem(addItem(data[dataIndex], draft.tailValue));
    }

    //#endregion

    //#region Debugging

    function debugInit() {

    }

    function debug() {
        let count = 0;
        let value = draft.headValue;
        while (value !== undefined && ++count <= 10) {
            const item = getItem(value);
            console.log(value, current(item));

            value = item.next;
        }
    }


    //#endregion


    //Utilities
    function setActiveIndex(index) {
        draft.activeIndex = index;
        draft.virtualActiveIndex = index;

        draft.searchLetter = null;

        draft.pageIndex = selectors.getActivePageIndex(draft);
    }

    function clearSelection() {
        draft.selection.clear();
        draft.pivotIndex = draft.activeIndex;
    }

    function selectOne(value) {
        draft.selection.clear();
        draft.selection.add(value);
    }

    function parseValue(value) {
        return draft.items[value][valueProperty];
    }

    function setItems(array) {
        Object.assign(draft, {
            items: _.keyBy(array, valueProperty),
            isLoading: false,
            error: null
        });

        setActiveIndex(0);
        clearSelection();
    }

    function parseIndex(index) {
        index = parseInt(index);
        return _.inRange(index, selectors.getItemCount(original(draft)))
            ? index : null;
    }


    function clearItems() {
        Object.assign(draft, {
            headValue: null,
            tailValue: null,
            visibleItemCount: 0,
            tableItems: [],
            items: {},
            isLoading: false,
            error: null
        });

        setActiveIndex(0);
        clearSelection();
    }


    function goToPage(index) {
        if (!_.inRange(index, selectors.getPageCount(draft))) return;

        draft.pageIndex = index;

        draft.virtualActiveIndex = selectors.getActivePageIndex(draft) === index
            ? draft.activeIndex
            : selectors.getFirstVisibleIndex(draft);
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

        const nextState = produce(state, newDraft => {
            draft = newDraft;

            const { payload } = action;
            switch (action.type) {
                case types.DEBUG: {
                    debug();
                    break;
                }

                //Items
                case types.SET_ITEMS: {
                    setItems(payload.items);
                    addItems(payload.items);
                    break;
                }
                case types.ADD_ITEMS: {
                    const { items } = payload;
                    if (!items.length) break;

                    clearSelection();
                    for (let item of items) {
                        const value = item[valueProperty];
                        draft.items[value] = item;

                        if (multiSelect) draft.selection.add(value);
                    }
                    break;
                }
                case types.DELETE_ITEMS: {
                    const { values } = payload;
                    if (!values.length) break;

                    for (let value of values)
                        delete draft.items[value];

                    setActiveIndex(draft.pivotIndex);
                    clearSelection();
                    break;
                }
                case types.SET_ITEM_VALUES: {
                    _.forEach(payload.map, (newValue, oldValue) => {
                        oldValue = parseValue(oldValue);
                        if (oldValue === newValue) return;

                        //Update selection
                        _.replaceSetValue(draft.selection, oldValue, newValue);

                        //Create new item
                        const newItem = draft.items[oldValue];
                        newItem[valueProperty] = newValue;
                        draft.items[newValue] = newItem;

                        //Delete old item
                        delete draft.items[oldValue];
                    });

                    break;
                }
                case types.PATCH_ITEMS: {
                    clearSelection();
                    for (let patch of payload.patches)
                        Object.assign(draft.items[patch[valueProperty]], patch);
                    break;
                }
                case types.SORT_ITEMS: {
                    setActiveIndex(0);
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
                    setActiveIndex(0);
                    clearSelection();

                    draft.filter = payload.filter;
                    break;
                }
                case types.CLEAR_ITEMS: {
                    setItems([]);
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
                case types.SELECT: {
                    const {shiftKey, ctrlKey} = payload;

                    let index = parseIndex(payload.index);
                    if (index === null) break;

                    if (payload.fromKeyboard && draft.virtualActiveIndex !== draft.activeIndex)
                        draft.pivotIndex = draft.virtualActiveIndex;

                    setActiveIndex(index);

                    const values = selectors.getSortedValues(state);
                    const value = values[index];

                    if (!multiSelect) {
                        selectOne(value);
                        break;
                    }

                    const { selection } = draft;

                    if (!ctrlKey)
                        selection.clear();

                    if (shiftKey) {
                        if (ctrlKey) {
                            //Clear previous selection
                            _.forRange(draft.pivotIndex, state.activeIndex, i =>
                                selection.delete(values[i]));
                        }

                        _.forRange(draft.pivotIndex, index, i =>
                            selection.add(values[i]));

                        break;
                    }

                    draft.pivotIndex = index;

                    const selected = !ctrlKey || !selection.has(value);
                    _.toggleSetValue(selection, value, selected);

                    break;
                }
                case types.CONTEXT_MENU: {
                    //Should still be dispatched for middleware
                    if (payload.ctrlKey) break;

                    const index = parseIndex(payload.index);
                    if (index === null) {
                        if (!listBox) clearSelection();
                        break;
                    }

                    setActiveIndex(index);

                    if (listBox) break;

                    const value = selectors.getSortedValues(state)[index];
                    if (draft.selection.has(value)) break;

                    selectOne(value);
                    break;
                }
                case types.CLEAR_SELECTION: {
                    clearSelection();
                    break;
                }
                case types.SET_SELECTED: {
                    //Active index
                    const setActive = parseIndex(payload.active);
                    if (setActive !== null)
                        setActiveIndex(setActive);

                    //Pivot index
                    const setPivot = parseIndex(payload.pivot);
                    if (setPivot !== null)
                        draft.pivotIndex = setPivot;

                    //Selection
                    _.forEach(payload.map, (selected, index) => {
                        index = parseIndex(index);
                        if (index === null) return;

                        const value = selectors.getSortedValues(state)[index];
                        _.toggleSetValue(draft.selection, value, selected);
                    });
                    break;
                }
                case types.SELECT_ALL: {
                    draft.selection = new Set(selectors.getSortedValues(state));
                    break;
                }
                case types.SET_ACTIVE: {
                    const index = parseIndex(payload.index);
                    if (index === null) break;

                    setActiveIndex(index);
                    draft.pivotIndex = index;
                    break;
                }
                case types.SEARCH: {
                    const letter = payload.letter.toLowerCase();
                    const matches = selectors.getSearchIndex(state)[letter];
                    if (!matches) break;

                    //Find item index
                    const nextIndex = draft.matchIndex + 1;
                    const matchIndex = letter === draft.searchLetter && nextIndex < matches.length ? nextIndex : 0;
                    const itemIndex = matches[matchIndex];

                    //Select item
                    setActiveIndex(itemIndex);
                    selectOne(selectors.getSortedValues(state)[itemIndex]);

                    draft.searchLetter = letter;
                    draft.matchIndex = matchIndex;
                    break;
                }

                //Pagination
                case types.SET_PAGE_SIZE: {
                    const newSize = parseInt(payload.size);
                    //NaN >= x is false so doing the comparison in this way avoids an isNaN check
                    if (!(newSize >= 0)) break;

                    draft.pageSize = newSize;
                    setActiveIndex(draft.activeIndex); //Go to the active page
                    break;
                }
                case types.NEXT_PAGE: {
                    goToPage(draft.pageIndex + 1);
                    break;
                }
                case types.PREV_PAGE: {
                    goToPage(draft.pageIndex - 1);
                    break;
                }
                case types.FIRST_PAGE: {
                    goToPage(0);
                    break;
                }
                case types.LAST_PAGE: {
                    goToPage(selectors.getPageCount(draft) - 1);
                    break;
                }
                default: {
                    break;
                }
            }
        });

        console.log(state.tableItems);

        //A new object will rarely be created
        return produce(nextState, _draft => {
            draft = _draft;

            const maxItem = Math.max(selectors.getItemCount(nextState) - 1, 0);
            draft.activeIndex = Math.min(draft.activeIndex, maxItem);
            draft.virtualActiveIndex = Math.min(draft.virtualActiveIndex, maxItem);
            draft.pivotIndex = Math.min(draft.pivotIndex, maxItem);

            const maxPage = Math.max(selectors.getPageCount(nextState) - 1, 0);
            draft.pageIndex = Math.min(draft.pageIndex, maxPage);
        });
    }
}
