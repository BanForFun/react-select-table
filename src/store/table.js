import produce from "immer";
import _ from "lodash";
import {pagePositions, sortOrders} from "../constants/enums";
import {sortTuple} from "../utils/mathUtils";
import {inArray, pullFirst} from "../utils/arrayUtils";
import {deleteKeys} from "../utils/objectUtils";
import actions from "../models/internalActions";
import {setOptions} from "../utils/optionUtils";
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {createSelector} from "reselect";

const defaultState = {
    sortBy: {},
    columnOrder: null,
    columnWidth: [],
    selectedValues: [],
    activeValue: null,
    filter: null,
    items: {},
    pivotValue: null,
    tableItems: [],
    isLoading: false,
    pageSize: 0,
    currentPage: 1,
    error: null
};

function getColumnWidth(count) {
    const width = 100 / count;
    return _.times(count, _.constant(width));
}

export default function createTable(namespace, options = {}, initState = {}) {
    //State
    let draft = _.defaults(initState, defaultState);

    //Options
    const {
        valueProperty,
        listBox,
        multiSelect,
        scrollX,
        multiSort
    } = setOptions(namespace, options);

    if (options.initItems)
        setItems(options.initItems, false);

    if (options.initColCount)
        draft.columnWidth = getColumnWidth(options.initColCount);

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
            _.orderBy(items, Object.keys(sortBy), Object.values(sortBy))
    );

    const getValues = createSelector(
        s => s.tableItems,
        items => _.map(items, valueProperty)
    );

    //Updaters (validators)
    function updateColumns() {
        if (!draft.columnOrder) return;
        const count = draft.columnOrder.length;
        if (draft.columnWidth.length !== count)
            draft.columnWidth = getColumnWidth(count);
    }

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
        const newValues = _.map(draft.tableItems, valueProperty);
        const toDeselect = _.difference(draft.selectedValues, newValues);
        deselectRows(toDeselect);
    }

    //Helpers
    function deselectRows(toDeselect) {
        //Active value
        if (toDeselect.includes(draft.activeValue))
            draft.activeValue = null;

        //Selected values
        _.pullAll(draft.selectedValues, toDeselect);
    }

    function setActivePivotValue(value) {
        draft.pivotValue = draft.activeValue = value;
    }

    function setItems(items, areKeyed) {
        draft.items = areKeyed ? items : _.keyBy(items, valueProperty);
        draft.isLoading = false;
    }

    //Validate initial state
    updateItems();
    updateSelection();
    updateColumns();
    updatePagination();

    return (state = initState, action) => {
        if (action.namespace !== namespace) return state;

        return produce(state, newDraft => {
            draft = newDraft;

            const { payload } = action;
            switch (action.type) {
                //Items
                case actions.SET_ROWS: {
                    setItems(payload.items, payload.keyed);
                    updateItems();
                    updateSelection();
                    break;
                }
                case actions.ADD_ROWS: {
                    for (let item of payload) {
                        const value = item[valueProperty];
                        draft.items[value] = item;
                    }
                    updateItems();
                    break;
                }
                case actions.DELETE_ROWS: {
                    deleteKeys(draft.items, payload);
                    deselectRows(payload);
                    updateItems();
                    break;
                }
                case actions.SET_ROW_VALUES: {
                    //Update active value
                    const newActive = payload[draft.activeValue];
                    if (newActive)
                        draft.activeValue = newActive;

                    for (let oldValue in payload) {
                        const newValue = payload[oldValue];

                        //Update selected value
                        const selectedIndex = state.selectedValues.indexOf(oldValue);
                        if (selectedIndex >= 0)
                            draft.selectedValues[selectedIndex] = newValue;

                        //Create new item
                        draft.items[newValue] = {
                            ...state.items[oldValue],
                            [valueProperty]: newValue
                        };

                        //Delete old item
                        delete draft.items[oldValue];
                    }

                    updateItems();
                    break;
                }
                case actions.PATCH_ROWS: {
                    const {items} = draft;
                    for (let patch of payload) {
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
                case actions.CLEAR_ROWS: {
                    //Clear items
                    draft.items = {};
                    draft.tableItems = [];
                    draft.isLoading = true;
                    draft.error = null;

                    //Clear selection
                    draft.selectedValues = [];
                    break;
                }
                case actions.SORT_BY: {
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
                case actions.SET_FILTER: {
                    draft.filter = payload;
                    updateItems();
                    updateSelection();
                    break;
                }
                case actions.SET_ERROR: {
                    draft.isLoading = false;
                    draft.error = payload;
                    break;
                }

                //Selection
                case actions.SELECT_ROW: {
                    const { value, ctrlKey, shiftKey } = payload;
                    let addToSelection = [value];

                    if (!multiSelect) {
                        draft.selectedValues = addToSelection;
                        draft.activeValue = value;
                        break;
                    }

                    const isSelected = state.selectedValues.includes(value);
                    if (shiftKey) {
                        const values = getValues(draft);
                        const pivotIndex = values.indexOf(state.pivotValue);
                        const newIndex = values.indexOf(value);

                        const [startIndex, endIndex] = sortTuple(pivotIndex, newIndex);
                        addToSelection = values.slice(startIndex, endIndex + 1);
                    } else if (ctrlKey && isSelected) {
                        pullFirst(draft.selectedValues, value);
                        addToSelection = [];
                    }

                    //Set active value
                    draft.activeValue = value;
                    //Set pivot value
                    if (!shiftKey) draft.pivotValue = value;
                    //Set selected values
                    if (ctrlKey)
                        draft.selectedValues.push(...addToSelection);
                    else
                        draft.selectedValues = addToSelection;

                    break;
                }
                case actions.CLEAR_SELECTION: {
                    setActivePivotValue(null);
                    if (!options.listBox)
                        draft.selectedValues = [];
                    break;
                }
                case actions.SET_ROW_SELECTED: {
                    const { value, selected } = payload;

                    if (!selected)
                        pullFirst(draft.selectedValues, value);
                    else
                        draft.selectedValues.push(value);
                    break;
                }
                case actions.SELECT_ALL: {
                    draft.selectedValues = getValues(draft);
                    break;
                }
                case actions.SET_ACTIVE_ROW: {
                    setActivePivotValue(payload);
                    break;
                }
                case actions.CONTEXT_MENU: {
                    const { value, ctrlKey } = payload;
                    //This action should still be dispatched in order to be handeled by eventMiddleware
                    if (ctrlKey) break;

                    setActivePivotValue(value);
                    const isSelected = state.selectedValues.includes(value);
                    if (!listBox && !isSelected)
                        draft.selectedValues = inArray(value);
                    break;
                }

                //Columns
                case actions.SET_COLUMN_WIDTH: {
                    const { index, width } = payload;
                    const minWidth = options.minColumnWidth;

                    if (scrollX) {
                        draft.columnWidth[index] = Math.max(width, minWidth);
                        break;
                    }

                    const thisWidth = draft.columnWidth[index];
                    const nextWidth = draft.columnWidth[index + 1];

                    const availableWidth = thisWidth + nextWidth;
                    const maxWidth = availableWidth - minWidth;

                    const limitedWidth = _.clamp(width, minWidth, maxWidth);
                    draft.columnWidth[index] = limitedWidth;
                    draft.columnWidth[index + 1] = availableWidth - limitedWidth;
                    break;
                }
                case actions.SET_COLUMN_ORDER: {
                    draft.columnOrder = payload;
                    updateColumns(draft);
                    break;
                }

                //Pagination
                case actions.SET_PAGE_SIZE: {
                    draft.pageSize = payload;
                    draft.currentPage = 1;
                    updatePagination(draft);
                    break;
                }
                case actions.GO_TO_PAGE: {
                    //Payload is index
                    let newIndex = state.currentPage;
                    let allowZero = false;

                    switch (payload) {
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
                            newIndex = isNaN(payload) ? 0 : payload;
                            allowZero = true;
                            break;
                    }

                    draft.currentPage = newIndex;
                    updatePagination(draft, allowZero);
                    break;
                }

                //Internal
                case actions.SET_COLUMN_COUNT: {
                    //Check necessary for initial columnWidth state
                    if (state.columnWidth.length === payload) break;
                    draft.columnOrder = null;
                    draft.columnWidth = getColumnWidth(payload);
                    break;
                }
                default:
                    break;
            }
        });
    }
}
