import _ from "lodash";
import produce, {enableMapSet} from "immer";
import {deleteKeys} from "../utils/objectUtils";
import Actions from "../models/actions";
import {setOptions} from "../utils/optionUtils";
import {createSelector} from "reselect";
import {forRange} from "../utils/loopUtils";

enableMapSet();

const sortOrders = Object.freeze({
    Ascending: "asc",
    Descending: "desc"
});

function getNextSortOrder(order) {
    switch (order) {
        case sortOrders.Ascending:
            return sortOrders.Descending;
        case sortOrders.Descending:
            return null;
        default:
            return sortOrders.Ascending;
    }
}

const defaultState = {
    selection: new Set(),
    activeIndex: 0,
    pivotIndex: 0,
    filter: null,
    items: {},
    sortBy: {},
    tableItems: [],
    isLoading: false,
    pageSize: 0,
    pageIndex: 0,
    error: null
};

export default function createTable(namespace, options = {}) {
    const {
        valueProperty,
        listBox,
        multiSelect,
        multiSort,
        utils
    } = setOptions(namespace, options);

    const initState = {...defaultState, ...options.initState};
    let draft = initState;

    //Selectors
    const getParsedItems = createSelector(
        s => s.items,
        items => _.map(items, options.itemParser)
    );

    const getFilteredItems = createSelector(
        getParsedItems,
        s => s.filter,
        (items, filter) =>
            _.filter(items, item => options.itemPredicate(item, filter))
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
        draft.pageIndex = pageSize
            ? Math.trunc(draft.activeIndex / pageSize) : 0;
    }

    function isValidIndex(index) {
        return Number.isInteger(index) &&
            _.inRange(index, 0, draft.tableItems.length);
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
            pageIndex: 0,
            isLoading: false,
            error: null
        });
    }

    //Updaters
    function updateItems() {
        //Validate items
        delete draft.items[null];

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
                case Actions.SET_ITEMS: {
                    setItems(payload.items);
                    updateItems();
                    setActiveIndex(0, true);
                    break;
                }
                case Actions.ADD_ITEMS: {
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
                case Actions.DELETE_ITEMS: {
                    const { values } = payload;
                    if (!values.length) break;

                    draft.selection.clear();
                    deleteKeys(draft.items, values);

                    updateItems();
                    break;
                }
                case Actions.SET_ITEM_VALUES: {
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
                case Actions.PATCH_ITEMS: {
                    // draft.selection.clear();
                    for (let patch of payload.patches) {
                        const item = draft.items[patch[valueProperty]];
                        if (!item) continue;

                        Object.assign(item, patch);
                    }

                    updateItems();
                    break;
                }
                case Actions.SORT_ITEMS: {
                    const { path, shiftKey } = payload;

                    if (!multiSort || !shiftKey)
                        draft.sortBy = {};

                    draft.sortBy[path] = getNextSortOrder(state.sortBy[path]);

                    updateItems();
                    setActiveIndex(0, true);
                    break;
                }
                case Actions.SET_ITEM_FILTER: {
                    draft.selection.clear();
                    draft.filter = payload.filter;

                    updateItems();
                    break;
                }
                case Actions.CLEAR_ITEMS: {
                    setItems([]);
                    break;
                }
                case Actions.START_LOADING: {
                    draft.isLoading = true;
                    break;
                }
                case Actions.SET_ERROR: {
                    Object.assign(draft, {
                        isLoading: false,
                        error: payload.error
                    });
                    break;
                }

                //Selection
                case Actions.SELECT: {
                    const { index, ctrlKey, shiftKey } = payload;
                    if (!isValidIndex(index)) break;

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
                            //Clear old selection
                            forRange(draft.pivotIndex, draft.activeIndex, i =>
                                selection.delete(values[i]));
                        }

                        forRange(draft.pivotIndex, index, i =>
                            selection.add(values[i]));

                        break;
                    }

                    resetPivot();
                    setSelected(value, !ctrlKey || !selection.has(value));
                    break;
                }
                case Actions.CLEAR_SELECTION: {
                    draft.selection.clear();
                    break;
                }
                case Actions.SET_SELECTED: {
                    const { map, active, pivot } = payload;

                    //Active index
                    if (active !== null)
                        draft.activeIndex = active;

                    //Pivot index
                    if (pivot !== null)
                        draft.pivotIndex = pivot;

                    //Selection
                    _.forEach(map, (select, index) => {
                        index = parseInt(index);
                        if (!isValidIndex(index)) return;

                        setSelected(getItemValue(index), select);
                    });
                    break;
                }
                case Actions.SELECT_ALL: {
                    draft.selection = new Set(getValues(draft));
                    break;
                }
                case Actions.SET_ACTIVE: {
                    setActiveIndex(payload.index, true);
                    break;
                }
                case Actions.CONTEXT_MENU: {
                    const { index, ctrlKey } = payload;
                    if (ctrlKey) break; //Should still be dispatched in order to be handled by eventMiddleware

                    const { selection } = draft;
                    if (index === null) {
                        if (!listBox) selection.clear();
                        break;
                    }

                    if (!isValidIndex(index)) break;

                    //Not null
                    draft.activeIndex = index;
                    if (listBox) break;

                    const value = getItemValue(index);
                    if (!selection.has(value))
                        replaceSelection(value);

                    break;
                }

                //Pagination
                case Actions.SET_PAGE_SIZE: {
                    const {size} = payload;
                    if (size < 0) break;

                    draft.pageSize = size;
                    break;
                }
                case Actions.GO_TO_PAGE: {
                    const newIndex = parseInt(payload.index);
                    if (isNaN(newIndex)) break;

                    const pageCount = getPageCount();
                    draft.pageIndex = _.clamp(newIndex, 0, pageCount - 1);
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
