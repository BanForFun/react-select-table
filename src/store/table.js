import _ from "lodash";
import produce, {enableMapSet, original} from "immer";
import {types} from "../models/Actions";
import {setOptions} from "../utils/tableUtils";

enableMapSet();

const sortOrders = Object.freeze({
    Ascending: "asc",
    Descending: "desc"
});

export default function createTable(namespace, options = {}) {
    const selectors = setOptions(namespace, options);

    const initState = {
        selection: new Set(),
        activeIndex: 0,
        pivotIndex: 0,
        virtualActiveIndex: 0,
        filter: null,
        items: {},
        sortBy: {},
        isLoading: false,
        pageSize: 0,
        pageIndex: 0,
        error: null,
        ...options.initState
    };

    const {
        valueProperty,
        listBox,
        multiSelect,
        multiSort
    } = options;

    let draft;

    const getState = () => original(draft);

    //Utilities
    function setActiveIndex(index) {
        draft.activeIndex = index;
        draft.virtualActiveIndex = index;

        draft.pageIndex = selectors.getItemPageIndex(draft, index); //This selector can accept draft
    }

    function clearSelection(resetActive = false) {
        if (resetActive)
            setActiveIndex(0);

        draft.selection.clear();
        draft.pivotIndex = draft.activeIndex;
    }

    function replaceSelection(value) {
        draft.selection.clear();
        draft.selection.add(value);
    }

    function parseValue(value) {
        return draft.items[value][valueProperty];
    }

    function setItems(array) {
        clearSelection(true);
        Object.assign(draft, {
            items: _.keyBy(array, valueProperty),
            isLoading: false,
            error: null
        });
    }

    function parseIndex(index) {
        index = parseInt(index);
        return _.inRange(index, selectors.getItemCount(getState()))
            ? index : null;
    }

    return (state = initState, action) => {
        if (action.namespace !== namespace)
            return state;

        return produce(state, _draft => {
            draft = _draft;

            const { payload } = action;
            switch (action.type) {
                //Items
                case types.SET_ITEMS: {
                    setItems(payload.items);
                    break;
                }
                case types.ADD_ITEMS: {
                    const { items } = payload;
                    if (!items.length) break;

                    clearSelection();
                    for (let item of items) {
                        const value = item[valueProperty];
                        draft.items[value] = item;

                        if (!multiSelect) continue;
                        draft.selection.add(value);
                    }
                    break;
                }
                case types.DELETE_ITEMS: {
                    const { values } = payload;
                    if (!values.length) break;

                    clearSelection();
                    _.unsetMany(draft.items, values);
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
                    clearSelection(true);
                    const { path, shiftKey } = payload;

                    if (!multiSort || !shiftKey)
                        draft.sortBy = {};

                    const { sortBy } = draft;
                    switch(state.sortBy[path]) {
                        case sortOrders.Ascending:
                            sortBy[path] = sortOrders.Descending;
                            break;
                        case sortOrders.Descending:
                            if (shiftKey) delete sortBy[path];
                            else sortBy[path] = sortOrders.Ascending;
                            break;
                        default:
                            sortBy[path] = sortOrders.Ascending;
                            break;
                    }
                    break;
                }
                case types.SET_ITEM_FILTER: {
                    clearSelection(true);
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

                    const value = selectors.getItemValue(state, index);

                    if (!multiSelect) {
                        replaceSelection(value);
                        break;
                    }

                    const { selection } = draft;

                    if (!ctrlKey)
                        selection.clear();

                    if (shiftKey) {
                        const values = selectors.getSortedValues(state);

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

                    const value = selectors.getItemValue(state, index);
                    if (draft.selection.has(value)) break;

                    replaceSelection(value);
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

                        const value = selectors.getItemValue(state, index);
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

                //Pagination
                case types.SET_PAGE_SIZE: {
                    const newSize = parseInt(payload.size);
                    //NaN >= x is always false so doing the comparison in this way avoids an isNaN check
                    if (!(newSize >= 0)) break;

                    draft.pageSize = newSize;
                    setActiveIndex(draft.activeIndex);
                    break;
                }
                case types.GO_TO_PAGE: {
                    const index = parseInt(payload.index);
                    if (!_.inRange(index, selectors.getPageCount(state))) break;

                    draft.pageIndex = index;

                    // const visibleRange = selectors.getVisibleRange(draft);
                    // draft.virtualActiveIndex = visibleRange.includes(draft.activeIndex)
                    //     ? draft.activeIndex
                    //     : visibleRange.start
                    break;
                }
                default:
                    break;
            }

            //TODO: Validator middleware

            // const itemCount = draft.tableItems.length;
            // if (itemCount < state.tableItems.length) {
            //     const maxItem = Math.max(itemCount - 1, 0);
            //     draft.activeIndex = Math.min(draft.activeIndex, maxItem);
            //     draft.virtualActiveIndex = Math.min(draft.virtualActiveIndex, maxItem);
            //     draft.pivotIndex = Math.min(draft.pivotIndex, maxItem);
            //
            //     const maxPage = Math.max(selectors.getPageCount(draft) - 1, 0);
            //     draft.pageIndex = Math.min(draft.pageIndex, maxPage);
            // }
        });
    }
}
