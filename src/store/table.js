import produce, {enableMapSet} from "immer";
import _ from "lodash";
import {pagePositions, sortOrders} from "../constants/enums";
import {deleteKeys} from "../utils/objectUtils";
import Actions from "../models/actions";
import {setOptions} from "../utils/optionUtils";
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {createSelector} from "reselect";
import {forRange} from "../utils/loopUtils";

enableMapSet();

const defaultState = {
    selection: new Set(),
    activeValue: null,
    pivotValue: null,
    filter: null,
    items: {},
    sortBy: {},
    tableItems: [],
    isLoading: false,
    pageSize: 0,
    currentPage: 1,
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
        draft.items = _.keyBy(options.initItems, valueProperty);

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
    function updatePagination(allowZero = false) {
        const index = draft.currentPage;
        const min = allowZero ? 0 : 1;
        const count = getPageCount(draft);
        draft.currentPage = _.clamp(index, min, count);
    }

    function updateItems() {
        draft.tableItems = getSortedItems(draft);
    }

    function updateSelection() {
        const newSelection = new Set();
        for (let value of getValues(draft)) {
            if (!draft.selection.has(value)) continue;
            newSelection.add(value);
        }

        draft.selection = newSelection;
    }

    function updateActive() {
        if (draft.activeValue == null)
            trySetActiveIndex(0);
    }

    function setActiveValue(value) {
        //Convert undefined to null
        draft.activeValue = value ?? null;
        draft.pivotValue = null;
    }

    function clearSelection() {
        draft.selection.clear();
        setActiveValue(null);
    }

    function trySetActiveIndex(index) {
        const items = draft.tableItems;
        if (!items.length) return;

        const newIndex = _.clamp(index, 0, items.length - 1);
        setActiveValue(items[newIndex][valueProperty]);
    }

    function restoreValueFormat(value) {
        return draft.items[value][valueProperty];
    }

    //Validate initial state
    updateItems();
    updateSelection();
    updateActive();
    updatePagination();

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

                    Object.assign(draft, {
                        items: Array.isArray(items) ? _.keyBy(items, valueProperty) : items,
                        isLoading: false,
                        error: null
                    });

                    updateItems();
                    updateSelection();
                    updateActive();
                    break;
                }
                case Actions.ADD_ROWS: {
                    const { items } = payload;
                    if (!items.length) break;

                    //Clear selection
                    const {selection} = draft;
                    selection.clear();

                    //Add items
                    items.forEach(item => {
                        const value = item[valueProperty];
                        draft.items[value] = item;
                        selection.add(value);
                    });
                    updateItems();
                    updateSelection();

                    //Set first visible added item active
                    setActiveValue(_.find(getValues(draft), v => selection.has(v)));
                    break;
                }
                case Actions.DELETE_ROWS: {
                    const { values } = payload;
                    if (!values.length) break;

                    //Store previous active index
                    const activeIndex = _.findIndex(draft.tableItems,
                        item => item[valueProperty] === draft.activeValue);

                    //Delete items
                    deleteKeys(draft.items, values);
                    updateItems();
                    updateSelection();

                    //Restore active index
                    trySetActiveIndex(activeIndex);
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

                    //Update active value
                    const newActive = map[draft.activeValue];
                    if (newActive !== undefined)
                        draft.activeValue = newActive;

                    //Update pivot value
                    const newPivot = map[draft.pivotValue];
                    if (newPivot !== undefined)
                        draft.pivotValue = newPivot;

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
                case Actions.CLEAR_ROWS: {
                    clearSelection();
                    Object.assign(draft, {
                        items: {},
                        tableItems: [],
                        isLoading: false,
                        error: null
                    });

                    updateItems();
                    break;
                }
                case Actions.SORT_BY: {
                    const { path, shiftKey } = payload;

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
                    draft.filter = payload.filter;
                    updateItems();
                    updateSelection();
                    break;
                }

                //Displaying
                case Actions.SET_ERROR: {
                    draft.isLoading = false;
                    draft.error = payload.error;
                    break;
                }
                case Actions.START_LOADING: {
                    draft.isLoading = true;
                    draft.error = null;
                    break;
                }

                //Selection
                case Actions.SELECT_ROW: {
                    const { value, ctrlKey, shiftKey } = payload;
                    const { selection } = draft;

                    draft.activeValue = value;

                    if (!multiSelect) {
                        selection.clear();
                        selection.add(value);
                        break;
                    }

                    if (!ctrlKey)
                        selection.clear();

                    if (shiftKey) {
                        draft.pivotValue ??= state.activeValue;

                        const values = getValues(draft);
                        const pivotIndex = values.indexOf(draft.pivotValue);
                        const prevIndex = values.indexOf(state.activeValue);
                        const newIndex = values.indexOf(value);

                        if (ctrlKey) {
                            //Clear old selection
                            forRange(pivotIndex, prevIndex, i =>
                                selection.delete(values[i]));
                        }

                        forRange(pivotIndex, newIndex, i =>
                            selection.add(values[i]));

                        break;
                    }

                    draft.pivotValue = null;

                    if (ctrlKey && selection.has(value))
                        selection.delete(value);
                    else
                        selection.add(value);

                    break;
                }
                case Actions.CLEAR_SELECTION: {
                    draft.selection.clear();
                    draft.pivotValue = null;
                    break;
                }
                case Actions.SET_ROWS_SELECTED: {
                    _.forEach(payload.map, (select, value) => {
                        value = restoreValueFormat(value);

                        if (!select)
                            return draft.selection.delete(value);

                        draft.selection.add(value);
                        draft.activeValue = value;
                    });
                    break;
                }
                case Actions.SELECT_ALL: {
                    draft.selection = new Set(getValues(draft));
                    break;
                }
                case Actions.SET_ACTIVE_ROW: {
                    setActiveValue(payload.value);
                    break;
                }
                case Actions.SET_PIVOT_ROW: {
                    draft.pivotValue = payload.value;
                    break;
                }
                case Actions.CONTEXT_MENU: {
                    const { value, ctrlKey } = payload;
                    const { selection } = draft;

                    //This action should still be dispatched in order to be handled by eventMiddleware
                    if (ctrlKey) break;

                    if (value !== null)
                        setActiveValue(value);

                    if (listBox || selection.has(value)) break;
                    selection.clear();
                    selection.add(value);

                    break;
                }

                //Pagination
                case Actions.SET_PAGE_SIZE: {
                    draft.pageSize = payload.size;
                    draft.currentPage = 1;
                    updatePagination(draft);
                    break;
                }
                case Actions.GO_TO_PAGE: {
                    const {index} = payload;

                    let allowZero = false;
                    let newIndex = state.currentPage;
                    switch (index) {
                        case pagePositions.Last:
                            newIndex = getPageCount(draft);
                            break;
                        case pagePositions.Next:
                            newIndex++;
                            break;
                        case pagePositions.Previous:
                            newIndex--;
                            break;
                        default:
                            newIndex = isNaN(index) ? 0 : index;
                            allowZero = true;
                            break;
                    }

                    draft.currentPage = newIndex;
                    updatePagination(draft, allowZero);
                    break;
                }
                default:
                    break;
            }

            //Ensure selection doesn't contain null
            draft.selection.delete(null);
        });
    }
}
