import _ from "lodash";
import produce, {enableMapSet} from "immer";
import {deleteKeys} from "../utils/objectUtils";
import {types} from "../models/Actions";
import {setOptions} from "../utils/tableUtils";
import {createSelector} from "reselect";
import {forRange} from "../utils/loopUtils";

enableMapSet();

const sortOrders = Object.freeze({
    Ascending: "asc",
    Descending: "desc"
});

export default function createTable(namespace, options = {}) {
    const { utils } = setOptions(namespace, options);

    const initState = {
        selection: new Set(),
        activeIndex: 0,
        pivotIndex: 0,
        filter: null,
        items: {},
        sortBy: {},
        tableItems: [],
        isLoading: false,
        pageSize: 0,
        page: 1,
        error: null,
        ...options.initState
    };

    let draft = initState;

    const {
        valueProperty,
        listBox,
        multiSelect,
        multiSort
    } = options;

    //Selectors
    const getParsedItems = createSelector(
        s => s.items,
        items => _.map(items, options.itemParser)
    );

    const getFilteredItems = createSelector(
        getParsedItems,
        s => s.filter,
        (items, filter) =>
            filter ? _.filter(items, item => options.itemPredicate(item, filter)) : items
    );

    const getSortedItems = createSelector(
        getFilteredItems,
        s => s.sortBy,
        (items, sortBy) =>
            _.orderBy(items, _.keys(sortBy), _.values(sortBy))
    );

    const getValues = createSelector(
        s => s.tableItems,
        items => _.map(items, valueProperty)
    );

    //Getters
    const getPageCount = () =>
        utils.getPageCount(draft);

    const getItemValue = index =>
        utils.getItemValue(draft, index);

    //Utilities
    function setActiveIndex(index, doResetPivot = false) {
        draft.activeIndex = index;
        if (doResetPivot) resetPivot();

        const { pageSize } = draft;
        const pageIndex = pageSize ? Math.trunc(draft.activeIndex / pageSize) : 0;
        draft.page = pageIndex + 1;
    }

    function resetPivot() {
        draft.pivotIndex = draft.activeIndex;
    }

    function replaceSelection(value) {
        draft.selection.clear();
        draft.selection.add(value);
    }

    function setSelected(value, selected) {
        if (selected)
            draft.selection.add(value);
        else
            draft.selection.delete(value);
    }

    function safeSelect(value) {
        if (!multiSelect) draft.selection.clear();
        draft.selection.add(value);
    }

    function restoreValueFormat(value) {
        return draft.items[value][valueProperty];
    }

    function setItems(array) {
        draft.selection.clear();
        Object.assign(draft, {
            items: _.keyBy(array, valueProperty),
            tableItems: [],
            page: 1,
            isLoading: false,
            error: null
        });
    }

    function parseItemIndex(index) {
        index = parseInt(index);
        if (!_.inRange(index, draft.tableItems.length))
            return null;

        return index;
    }

    //Updaters
    function updateItems() {
        //Validate items
        delete draft.items[null];
        delete draft.items[undefined];

        //Update items
        draft.tableItems = getSortedItems(draft);
    }

    updateItems();

    return (state = initState, action) => {
        if (action.namespace !== namespace)
            return state;

        return produce(state, newDraft => {
            draft = newDraft;

            const { payload } = action;
            switch (action.type) {
                //Items
                case types.SET_ITEMS: {
                    setItems(payload.items);
                    updateItems();
                    setActiveIndex(0, true);
                    break;
                }
                case types.ADD_ITEMS: {
                    const { items } = payload;
                    if (!items.length) break;

                    draft.selection.clear();
                    for (let item of items) {
                        const value = item[valueProperty];
                        draft.items[value] = item;
                        safeSelect(value);
                    }

                    updateItems();
                    break;
                }
                case types.DELETE_ITEMS: {
                    const { values } = payload;
                    if (!values.length) break;

                    draft.selection.clear();
                    deleteKeys(draft.items, values);

                    updateItems();
                    break;
                }
                case types.SET_ITEM_VALUES: {
                    _.forEach(payload.map, (newValue, oldValue) => {
                        oldValue = restoreValueFormat(oldValue);

                        //Update selection
                        const {selection} = draft;
                        if (selection.delete(oldValue))
                            selection.add(newValue)

                        //Create new item
                        const newItem = draft.items[oldValue];
                        newItem[valueProperty] = newValue;
                        draft.items[newValue] = newItem;

                        //Delete old item
                        delete draft.items[oldValue];
                    });

                    updateItems();
                    break;
                }
                case types.PATCH_ITEMS: {
                    // draft.selection.clear();
                    for (let patch of payload.patches)
                        Object.assign(draft.items[patch[valueProperty]], patch);

                    updateItems();
                    break;
                }
                case types.SORT_ITEMS: {
                    const { path, shiftKey } = payload;

                    if (!multiSort || !shiftKey)
                        draft.sortBy = {};

                    const { sortBy } = draft;
                    switch(state.sortBy[path]) {
                        case sortOrders.Ascending:
                            sortBy[path] = sortOrders.Descending;
                            break;
                        case sortOrders.Descending:
                            if (shiftKey)
                                delete sortBy[path];
                            else
                                sortBy[path] = sortOrders.Ascending;
                            break;
                        default:
                            sortBy[path] = sortOrders.Ascending;
                            break;
                    }

                    updateItems();
                    setActiveIndex(0, true);
                    break;
                }
                case types.SET_ITEM_FILTER: {
                    draft.selection.clear();
                    draft.filter = payload.filter;

                    updateItems();
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
                    const { ctrlKey, shiftKey } = payload;

                    const index = parseItemIndex(payload.index);
                    if (index === null) break;

                    setActiveIndex(index);
                    const value = getItemValue(index);

                    if (!multiSelect) {
                        replaceSelection(value);
                        break;
                    }

                    const { selection } = draft;

                    if (!ctrlKey)
                        selection.clear();

                    if (shiftKey) {
                        const values = getValues(draft);

                        if (ctrlKey) {
                            //Clear previous selection
                            forRange(draft.pivotIndex, state.activeIndex,i =>
                                selection.delete(values[i]));
                        }

                        forRange(draft.pivotIndex, index, i =>
                            selection.add(values[i]));

                        break;
                    }

                    resetPivot();
                    setSelected(value, !(ctrlKey && selection.has(value)));
                    break;
                }
                case types.CLEAR_SELECTION: {
                    draft.selection.clear();
                    break;
                }
                case types.SET_SELECTED: {
                    //Active index
                    const setActive = parseItemIndex(payload.active);
                    if (setActive !== null)
                        draft.activeIndex = setActive;

                    //Pivot index
                    const setPivot = parseItemIndex(payload.pivot);
                    if (setPivot !== null)
                        draft.pivotIndex = setPivot;

                    //Selection
                    _.forEach(payload.map, (select, index) => {
                        index = parseItemIndex(index);
                        if (index === null) return;

                        setSelected(getItemValue(index), select);
                    });
                    break;
                }
                case types.SELECT_ALL: {
                    draft.selection = new Set(getValues(draft));
                    break;
                }
                case types.SET_ACTIVE: {
                    const index = parseItemIndex(payload.index);
                    if (index === null) break;

                    setActiveIndex(index, true);
                    break;
                }
                case types.CONTEXT_MENU: {
                    if (payload.ctrlKey) break; //Should still be dispatched in order to be handled by eventMiddleware

                    const { selection } = draft;
                    const index = parseItemIndex(payload.index);

                    //Invalid index
                    if (index === null) {
                        if (!listBox) selection.clear();
                        break;
                    }

                    //Valid index
                    draft.activeIndex = index;
                    if (listBox) break;

                    const value = getItemValue(index);
                    if (!selection.has(value))
                        replaceSelection(value);

                    break;
                }

                //Pagination
                case types.SET_PAGE_SIZE: {
                    const newSize = parseInt(payload.size);
                    //NaN >= x is always false so doing the comparison in this way avoids an isNaN check
                    if (!(newSize >= 0)) break;

                    draft.pageSize = newSize;
                    break;
                }
                case types.GO_TO_PAGE: {
                    const newPage = parseInt(payload.page);
                    if (!_.inRange(newPage - 1, getPageCount())) break;

                    draft.page = newPage;
                    break;
                }
                default:
                    break;
            }

            const itemCount = draft.tableItems.length;
            if (itemCount < state.tableItems.length) {
                const newActive = Math.min(draft.activeIndex, itemCount - 1);
                setActiveIndex(newActive, true);
            }
        });
    }
}
