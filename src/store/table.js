import produce, {enableMapSet} from "immer";
import _ from "lodash";
import {pagePositions, sortOrders} from "../constants/enums";
import {sortTuple} from "../utils/mathUtils";
import {deleteKeys} from "../utils/objectUtils";
import Actions from "../models/actions";
import {setOptions} from "../utils/optionUtils";
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {createSelector} from "reselect";

enableMapSet();

const defaultState = {
    selection: new Map(),
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
    )

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
        const visibleSet = new Set(getValues(draft));

        const deselect = [];
        for (let value of draft.selection)
            if (!visibleSet.has(value)) deselect.push(value);

        deselectRows(deselect);
    }

    //Helpers
    function deselectRows(deselect) {
        deselect.forEach(v => draft.selection.delete(v));
    }

    function selectRows(select, type = null) {
        select.forEach(v => draft.selection.set(v, type));
    }

    function setActivePivotValue(value) {
        draft.pivotValue = draft.activeValue = value;
    }

    function setActivePivotIndex(index) {
        const items = draft.tableItems;
        if (!items.length)
            return setActivePivotValue(null);

        const newIndex = _.clamp(index, 0, items.length - 1);
        setActivePivotValue(items[newIndex][valueProperty]);
    }

    //Validate initial state
    updateItems();
    updateSelection();
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
                    const { items, keyed } = payload;

                    draft.items = keyed ? items : _.keyBy(items, valueProperty);
                    draft.isLoading = false;
                    draft.error = null;

                    updateItems();
                    updateSelection();
                    setActivePivotIndex(0);
                    break;
                }
                case Actions.ADD_ROWS: {
                    const { items } = payload;
                    if (!items.length) break;

                    //Add items
                    const addedValues = new Set();
                    items.forEach(item => {
                        const value = item[valueProperty];
                        draft.items[value] = item;
                        addedValues.add(value);
                    });
                    updateItems();

                    //Select added visible items
                    const visibleValues = getValues(draft);
                    const { selection } = draft;

                    selection.clear();
                    for (let value of visibleValues) {
                        if (!addedValues.has(value)) continue;

                        //Set first added item as active
                        if (!selection.size)
                            setActivePivotValue(value);

                        selection.set(value, null);
                    }
                    break;
                }
                case Actions.DELETE_ROWS: {
                    const { values } = payload;
                    if (!values.length) break;

                    const activeIndex = _.findIndex(draft.tableItems,
                            item => item[valueProperty] === draft.activeValue);

                    //Deselect items
                    deselectRows(values);

                    //Delete items
                    deleteKeys(draft.items, values);
                    updateItems();

                    setActivePivotIndex(activeIndex);
                    break;
                }
                case Actions.SET_ROW_VALUES: {
                    _.forEach(payload.map, (newValue, oldValueString) => {
                        const oldValue = state.items[oldValueString][valueProperty];

                        //Update active value
                        if (oldValue === state.activeValue)
                            draft.activeValue = newValue;

                        //Update selected value
                        const {selection} = draft;
                        const type = selection.get(oldValue);
                        if (type !== undefined) {
                            selection.delete(oldValue);
                            selection.set(newValue, type);
                        }

                        //Create new item
                        draft.items[newValue] = {
                            ...state.items[oldValue],
                            [valueProperty]: newValue
                        };

                        //Delete old item
                        delete draft.items[oldValue];
                    })

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
                    const patch = {
                        items: {},
                        tableItems: [],
                        isLoading: false,
                        error: null,
                        selection: new Map(),
                        activeValue: null,
                        pivotValue: null
                    }
                    Object.assign(draft, patch);
                    break;
                }
                case Actions.SORT_BY: {
                    const { path, shiftKey } = payload;
                    if (!multiSort || !shiftKey)
                        draft.sortBy = {};

                    const { sortBy } = draft;
                    if (state.sortBy[path] === sortOrders.Ascending)
                        sortBy[path] = sortOrders.Descending;
                    else
                        sortBy[path] = sortOrders.Ascending;

                    updateItems();
                    break;
                }
                case Actions.SET_FILTER: {
                    draft.filter = payload.filter;
                    updateItems();
                    updateSelection();
                    break;
                }
                case Actions.SET_ERROR: {
                    draft.isLoading = false;
                    draft.error = payload.error;
                    break;
                }

                //Selection
                case Actions.SELECT_ROW: {
                    const { value, ctrlKey, shiftKey } = payload;
                    const { selection } = draft;

                    if (!multiSelect) {
                        selection.clear();
                        selection.set(value, null);
                        setActivePivotValue(value);
                        break;
                    }

                    if (!ctrlKey)
                        selection.clear();

                    if (shiftKey) {
                        const values = getValues(draft);
                        const pivotIndex = values.indexOf(state.pivotValue);
                        const newIndex = values.indexOf(value);

                        const [startIndex, endIndex] = sortTuple(pivotIndex, newIndex);
                        const newSelection = values.slice(startIndex, endIndex + 1);
                        selectRows(newSelection);
                    }
                    else if (ctrlKey && selection.has(value))
                        selection.delete(value);
                    else
                        selection.set(value, null);

                    //Set active value
                    draft.activeValue = value;

                    //Set pivot value
                    if (!shiftKey)
                        draft.pivotValue = value;

                    break;
                }
                case Actions.CLEAR_SELECTION: {
                    draft.selection.clear();
                    break;
                }
                case Actions.SET_ROW_SELECTED: {
                    const { value, selected, type } = payload;
                    const { selection } = draft;

                    if (selected) {
                        selection.set(value, type);
                        draft.activeValue = value;
                    }
                    else
                        selection.delete(value);
                    break;
                }
                case Actions.SELECT_ALL: {
                    draft.selection.clear();
                    selectRows(getValues(draft));
                    break;
                }
                case Actions.SET_ACTIVE_ROW: {
                    setActivePivotValue(payload.value);
                    break;
                }
                case Actions.CONTEXT_MENU: {
                    const { value, ctrlKey } = payload;
                    const { selection } = draft;

                    //This action should still be dispatched in order to be handled by eventMiddleware
                    if (ctrlKey) break;
                    setActivePivotValue(value);

                    if (listBox || selection.has(value)) break;
                    selection.clear();
                    selection.set(value, null);

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

                    let newIndex = state.currentPage;
                    let allowZero = false;

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
        });
    }
}
