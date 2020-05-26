import produce from "immer";
import _ from "lodash";
import { sortOrders, pagePositions } from "../constants/enums";
import { sortTuple } from "../utils/mathUtils";
import { pullFirst, inArray, areItemsEqual } from "../utils/arrayUtils";
import { deleteKeys } from "../utils/objectUtils";
import actions from "../models/internalActions";
import { defaultOptions, tableOptions } from "../utils/optionUtils";
import { makeGetPageCount } from "../selectors/paginationSelectors";
import { createSelector } from "reselect";

const defaultState = {
    sortPath: null,
    sortOrder: sortOrders.Ascending,
    columnOrder: null,
    columnWidth: [],
    selectedValues: [],
    activeValue: null,
    filter: null,
    items: {},
    pivotValue: null,
    tableItems: [],
    isLoading: true,
    pageSize: 0,
    currentPage: 1
};

function getDefaultWidth(count) {
    const width = 100 / count;
    return _.times(count, _.constant(width));
}

export function createTable(tableName, options = {}, initState = {}) {
    //Options
    _.defaults(options, defaultOptions);
    tableOptions[tableName] = options;
    const { valueProperty, isListbox, isMultiselect, scrollX } = options;

    //State
    let draft = _.defaults(initState, defaultState);

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
        s => s.sortPath,
        s => s.sortOrder,
        (items, path, order) => _.orderBy(items, [path], [order])
    );

    const getValues = createSelector(
        s => s.tableItems,
        items => _.map(items, valueProperty)
    );

    //Updaters
    const updateColumns = () => {
        if (!draft.columnOrder) return;
        const count = draft.columnOrder.length;
        if (draft.columnWidth.length !== count)
            draft.columnWidth = getDefaultWidth(count);
    }

    const updatePagination = (allowZero = false) => {
        const index = draft.currentPage;
        const min = allowZero ? 0 : 1;
        const count = getPageCount(draft);
        draft.currentPage = _.clamp(index, min, count);
    }

    const updateItems = () => {
        draft.tableItems = getSortedItems(draft);
    }

    const updateSelection = () => {
        const newValues = _.map(draft.tableItems, valueProperty);
        const toDeselect = _.difference(draft.selectedValues, newValues);
        deselectRows(toDeselect);
    }

    //Helpers
    const deselectRows = toDeselect => {
        //Active value
        if (toDeselect.includes(draft.activeValue))
            draft.activeValue = null;

        //Selected values
        _.pullAll(draft.selectedValues, toDeselect);
    }

    const setActivePivotValue = value => {
        draft.pivotValue = value;
        draft.activeValue = value;
    }

    //Events
    const eventHandlers = {};

    const _raiseContextMenu = () => {
        if (!eventHandlers.onContextMenu) return;

        const selected = [...draft.selectedValues];
        const active = inArray(draft.activeValue);
        eventHandlers.onContextMenu(isListbox ? active : selected);
    }

    const _raiseSelectionChange = () => {
        if (!eventHandlers.onSelectionChange) return;
        eventHandlers.onSelectionChange([...draft.selectedValues]);
    }

    updateItems();
    updateSelection();
    updateColumns();
    updatePagination();

    return (state = initState, action) => {
        const nextState = produce(state, newDraft => {
            if (action.table !== tableName) return;

            draft = newDraft;
            const { payload } = action;
            switch (action.type) {
                //Items
                case "FORM_GROUP_SET_DATA":
                case actions.SET_ROWS: {
                    const { data: items } = payload;
                    draft.items = _.keyBy(items, valueProperty);
                    draft.isLoading = false;
                    updateItems();
                    updateSelection();
                    break;
                }
                case actions.ADD_ROW: {
                    const { newItem } = payload;
                    const value = newItem[valueProperty];
                    draft.items[value] = newItem;
                    updateItems();
                    break;
                }
                case actions.DELETE_ROWS: {
                    const { values } = payload;
                    deleteKeys(draft.items, values);
                    deselectRows(values);
                    updateItems();
                    break;
                }
                case actions.REPLACE_ROW: {
                    //Value property should not be changed
                    draft.items[payload.value] = payload.newItem;
                    updateItems();
                    break;
                }
                case actions.SET_ROW_VALUE: {
                    const { oldValue, newValue } = payload;

                    //Update active value
                    if (state.activeValue === oldValue)
                        draft.activeValue = newValue;

                    //Update selection
                    const selectedIndex = state.selectedValues.indexOf(oldValue);
                    if (selectedIndex >= 0)
                        draft.selectedValues[selectedIndex] = newValue;

                    const withValue = {
                        ...state.items[oldValue],
                        [valueProperty]: newValue
                    };

                    draft.items[newValue] = withValue;
                    delete draft.items[oldValue];
                    updateItems();
                    break;
                }
                case actions.PATCH_ROW: {
                    //Value property should not be changed
                    const { value, patch } = payload;
                    Object.assign(draft.items[value], patch);
                    updateItems();
                    break;
                }
                case actions.CLEAR_ROWS: {
                    //Clear items
                    draft.items = {};
                    draft.tableItems = [];
                    draft.isLoading = true;

                    //Clear selection
                    draft.selectedValues = [];
                    break;
                }
                case actions.SORT_BY: {
                    const newPath = payload.path;

                    if (state.sortPath === newPath && state.sortOrder === sortOrders.Ascending)
                        draft.sortOrder = sortOrders.Descending;
                    else
                        draft.sortOrder = sortOrders.Ascending;

                    draft.sortPath = newPath;
                    updateItems();
                    break;
                }
                case actions.SET_FILTER: {
                    draft.filter = payload.filter;
                    updateItems();
                    _updateSelection();
                    break;
                }

                //Selection
                case actions.SELECT_ROW: {
                    const { value, ctrlKey, shiftKey } = payload;
                    let addToSelection = [value];

                    if (!isMultiselect) {
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
                    if (!options.isListbox)
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
                    setActivePivotValue(payload.value);
                    break;
                }
                case actions.CONTEXT_MENU: {
                    const { value, ctrlKey } = payload;

                    if (!ctrlKey) {
                        setActivePivotValue(value);

                        const isSelected = state.selectedValues.includes(value);
                        if (!isListbox && !isSelected)
                            draft.selectedValues = inArray(value);
                    }

                    _raiseContextMenu();
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
                    draft.columnOrder = payload.order;
                    updateColumns(draft);
                    break;
                }

                //Pagination
                case actions.SET_PAGE_SIZE: {
                    draft.pageSize = payload.size;
                    draft.currentPage = 1;
                    updatePagination(draft);
                    break;
                }
                case actions.GO_TO_PAGE: {
                    const { index } = payload;
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

                //Internal
                case actions.SET_COLUMN_COUNT: {
                    const { count } = payload;
                    if (state.columnWidth.length === count) break;

                    draft.columnOrder = null;
                    draft.columnWidth = getDefaultWidth(count);
                    break;
                }
                case actions.SET_EVENT_HANDLER: {
                    eventHandlers[payload.name] = payload.callback;
                    break;
                }
                default:
                    break;
            }
        })

        draft = nextState;

        if (!areItemsEqual(state.selectedValues, nextState.selectedValues))
            _raiseSelectionChange();

        return nextState;
    }
}