import produce, {enableMapSet, } from "immer";
import _ from "lodash";
import {pagePositions, sortOrders} from "../constants/enums";
import {deleteKeys} from "../utils/objectUtils";
import Actions from "../models/actions";
import {setOptions} from "../utils/optionUtils";
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {createSelector} from "reselect";
import {forRange} from "../utils/loopUtils";
import * as setUtils from "../utils/setUtils";

enableMapSet();

const defaultState = {
    selection: new Set(),
    activeIndex: 0,
    pivotIndex: null,
    filter: null,
    items: {},
    sortBy: {},
    tableItems: [],
    isLoading: false,
    pageSize: 0,
    currentPage: 0,
    error: null
};

export default function createTable(namespace, options = {}) {
    //Options
    setOptions(namespace, options);
    const {
        valueProperty,
        listBox,
        multiSelect,
        multiSort
    } = options;

    const initState = {...defaultState, ...options.initState};
    let draft = initState;

    if (options.initItems)
        draft.items = ensureKeyed(options.initItems);

    //Selectors
    const getPageCount = makeGetPageCount();

    const getParsedItems = createSelector(
        s => s.items,
        items => _.map(items, options.itemParser)
    );

    const getFilteredItems = createSelector(
        getParsedItems,
        s => s.filter,
        (items, filter) => _.filter(items, item =>
            options.itemPredicate(item, filter))
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

    //Updaters
    function updatePage() {
        draft.currentPage = _.clamp(draft.currentPage, 0, getPageCount(draft) - 1);
    }

    function updateItems() {
        //Validate items
        delete draft.items[null];

        //Update items
        draft.tableItems = getSortedItems(draft);

        //Update active value
        if (draft.activeIndex === null)
            setActiveIndex();
    }

    function updateSelection() {
        const {selection} = draft;

        //Validate selection
        selection.remove(null);

        if (!selection.size) return;

        if (!multiSelect) {
            const first = setUtils.getFirstItem(selection);
            selection.clear();
            selection.add(first);
        }
    }

    //Utilities
    function setActiveIndex(index = 0) {
        draft.pivotIndex = null;
        draft.activeIndex = draft.tableItems.length ? index : null;
    }

    function clearSelection() {
        draft.selection.clear();
    }

    function restoreValueFormat(value) {
        return draft.items[value][valueProperty];
    }

    function ensureKeyed(items) {
        return Array.isArray(items)
            ? _.keyBy(items, valueProperty)
            : items;
    }

    function patchDraft(patch) {
        Object.assign(draft, patch);
    }

    function getIndexValue(index) {
        const {currentPage, pageSize} = draft;
        const offset = pageSize && (currentPage * pageSize);
        return draft.tableItems[index + offset][valueProperty];
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
                case Actions.SET_ROWS: {
                    const { items } = payload;

                    clearSelection();

                    patchDraft({
                        items: ensureKeyed(items),
                        currentPage: 1,
                        isLoading: false,
                        error: null
                    });
                    updateItems();
                    break;
                }
                case Actions.ADD_ROWS: {
                    const { items } = payload;
                    if (!items.length) break;

                    clearSelection();

                    //Add items
                    for (let item of items) {
                        const value = item[valueProperty];
                        draft.selection.add(value);
                        draft.items[value] = item;
                    }
                    updateItems();

                    break;
                }
                case Actions.DELETE_ROWS: {
                    const { values } = payload;
                    if (!values.length) break;

                    clearSelection();
                    deleteKeys(draft.items, values);
                    updateItems();

                    break;
                }
                case Actions.SET_ROW_VALUES: {
                    const { map } = payload;
                    _.forEach(map, (newValue, oldValue) => {
                        oldValue = restoreValueFormat(oldValue);

                        //Update selection
                        const {selection} = draft;
                        if (selection.delete(oldValue))
                            selection.add(newValue)

                        //Create new item
                        draft.items[newValue] = {
                            ...draft.items[oldValue],
                            [valueProperty]: newValue
                        };

                        //Delete old item
                        delete draft.items[oldValue];
                    });
                    updateItems();

                    break;
                }
                case Actions.PATCH_ROWS: {
                    const {items} = draft;
                    for (let patch of payload.patches) {
                        const value = patch[valueProperty];

                        if (items[value])
                            //If item already exists, patch
                            Object.assign(items[value], patch);
                        else
                            //Otherwise, create
                            items[value] = patch;
                    }

                    updateItems();
                    break;
                }
                case Actions.SORT_BY: {
                    const { path, shiftKey } = payload;

                    clearSelection();

                    if (!multiSort || !shiftKey)
                        draft.sortBy = {};

                    draft.sortBy[path] =
                        state.sortBy[path] === sortOrders.Ascending
                        ? sortOrders.Descending
                        : sortOrders.Ascending

                    updateItems();
                    break;
                }
                case Actions.SET_FILTER: {
                    clearSelection();
                    draft.filter = payload.filter;
                    updateItems();
                    break;
                }
                case Actions.CLEAR_ROWS: {
                    clearSelection();
                    patchDraft({
                        items: {},
                        tableItems: [],
                        currentPage: 1,
                        isLoading: false,
                        error: null
                    });
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
                case Actions.SELECT_ROW: {
                    const { index, ctrlKey, shiftKey } = payload;
                    const { selection } = draft;
                    const value = getIndexValue(index);

                    draft.activeIndex = index;

                    if (!multiSelect) {
                        selection.clear();
                        selection.add(value);
                        break;
                    }

                    if (!ctrlKey)
                        selection.clear();

                    if (shiftKey) {
                        draft.pivotIndex ??= state.activeIndex;

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

                    draft.pivotIndex = null;

                    if (ctrlKey && selection.has(value))
                        selection.delete(value);
                    else
                        selection.add(value);

                    break;
                }
                case Actions.CLEAR_SELECTION: {
                    clearSelection();
                    draft.pivotIndex = null;
                    break;
                }
                case Actions.SET_ROWS_SELECTED: {
                    const {selection} = draft;
                    _.forEach(payload.map, (select, index) => {
                        index = +index;

                        const value = getIndexValue(index);
                        if (!select)
                            selection.delete(value);
                        else
                            selection.add(value);

                        if (select || !selection.size)
                            draft.activeIndex = index;
                    });
                    break;
                }
                case Actions.SELECT_ALL: {
                    draft.selection = new Set(getValues(draft));
                    break;
                }
                case Actions.SET_ACTIVE_INDEX: {
                    setActiveIndex(payload.index);
                    break;
                }
                case Actions.SET_PIVOT_INDEX: {
                    draft.pivotIndex = payload.index;
                    break;
                }
                case Actions.CONTEXT_MENU: {
                    const { index, ctrlKey } = payload;
                    const { selection } = draft;

                    //Should still be dispatched in order to be handled by eventMiddleware
                    if (ctrlKey) break;

                    if (index === null) {
                        selection.clear();
                        break;
                    }

                    setActiveIndex(index);

                    const value = getIndexValue(index);
                    if (listBox || selection.has(value)) break;

                    selection.clear();
                    selection.add(value);

                    break;
                }

                //Pagination
                case Actions.SET_PAGE_SIZE: {
                    draft.pageSize = payload.size;
                    draft.currentPage = 1;
                    break;
                }
                case Actions.GO_TO_PAGE: {
                    const {index} = payload;

                    let newIndex = state.currentPage;
                    switch (index) {
                        case pagePositions.Last:
                            newIndex = getPageCount(draft) - 1;
                            break;
                        case pagePositions.Next:
                            newIndex++;
                            break;
                        case pagePositions.Previous:
                            newIndex--;
                            break;
                        default:
                            newIndex = index;
                            break;
                    }

                    if (isNaN(newIndex)) break;
                    draft.currentPage = newIndex;

                    updatePage();
                    break;
                }
                default:
                    break;
            }

            if (draft.tableItems.length < state.tableItems.length) {
                setActiveIndex(draft.activeIndex);
                updatePage();
            }
        });
    }
}
