import produce from "immer";
import _ from "lodash";
import { pipe } from "lodash/fp";
import { sortOrder } from "../constants/enums";
import { sortTuple } from "../utils/mathUtils";
import { pullFirst, encloseInArray, areArraysEqual } from "../utils/arrayUtils";
import { deleteKeys } from "../utils/objectUtils";

const initState = {
    sort: {
        path: null,
        order: sortOrder.Ascending
    },
    columnOrder: null,
    columnWidth: [],
    selectedValues: [],
    activeValue: null,
    filter: {},
    items: {},
    pivotValue: null,
    tableItems: [],
    isLoading: true
};

export function createTable() {
    function getDefaultWidth(count) {
        const width = 100 / count;
        return _.times(count, _.constant(width));
    }

    let options = {};

    return (state = initState, action) => produce(state, draft => {
        const {
            valueProperty,
            isMultiselect,
            deselectOnContainerClick
        } = options;

        const values = _.map(state.tableItems, valueProperty);
        let updateSelection = false;

        //Prefix methods that don't mutate draft state with an underscore
        const _parseItems = items =>
            _.map(items, options.itemParser);

        const _filterItems = items =>
            _.filter(items, i => options.itemFilter(i, draft.filter));

        const _sortItems = items => {
            const { path, order } = draft.sort;
            return _.orderBy(items, [path], [order]);
        }

        const updateItems = (updateSelection = false) => {
            //Update items
            const transform = pipe(_parseItems, _filterItems, _sortItems);
            const newItems = transform(draft.items);
            draft.tableItems = newItems;

            //Deselect values that no longer exist
            if (!updateSelection) return;
            const newValues = _.map(newItems, valueProperty);
            const deselect = _.difference(draft.selectedValues, newValues);
            deselectRows(deselect);
        }

        const deselectRows = values => {
            //Update active value
            if (values.includes(state.activeValue))
                draft.activeValue = null;

            //Update selected values
            const { length } = _.pullAll(draft.selectedValues, values);
            if (length < state.selectedValues.length)
                raiseSelectionChange();
        }

        const setActivePivotValue = value => {
            draft.pivotValue = value;
            draft.activeValue = value;
        }

        const raiseContextMenu = () => {
            const selected = [...draft.selectedValues];
            const active = encloseInArray(draft.activeValue);
            options.onContextMenu(deselectOnContainerClick ? selected : active);
        }

        const raiseSelectionChange = () =>
            options.onSelectionChange([...draft.selectedValues]);

        switch (action.type) {
            //Items
            case TABLE_SET_ROWS: {
                const { items } = action;
                draft.items = _.keyBy(items, valueProperty);
                draft.isLoading = false;
                updateItems(true);
                break;
            }
            case TABLE_ADD_ROW: {
                const { newItem } = action;
                const value = newItem[valueProperty];
                draft.items[value] = newItem;
                updateItems();
                break;
            }
            case TABLE_DELETE_ROWS: {
                const { values } = action;
                deleteKeys(draft.items, values);
                updateItems();
                deselectRows(values);
                break;
            }
            case TABLE_REPLACE_ROW: {
                //Value property should not be changed
                draft.items[action.value] = action.newItem;
                updateItems();
                break;
            }
            case TABLE_SET_ROW_VALUE: {
                const { oldValue, newValue } = action;

                //Update active value
                if (state.activeValue === oldValue)
                    draft.activeValue = newValue;

                //Update selection
                const selectedIndex = state.selectedValues.indexOf(oldValue);
                if (selectedIndex >= 0) {
                    draft.selectedValues[selectedIndex] = newValue;
                    updateSelection = true;
                }

                const withValue = {
                    ...state.items[oldValue],
                    [valueProperty]: newValue
                };

                draft.items[newValue] = withValue;
                delete draft.items[oldValue];
                updateItems();
                break;
            }
            case TABLE_PATCH_ROW: {
                //Value property should not be changed
                const { value, patch } = action;
                Object.assign(draft.items[value], patch);
                updateItems();
                break;
            }
            case TABLE_SET_FILTER: {
                draft.filter = action.filter;
                updateItems(true);
                break;
            }

            //Selection
            case TABLE_SELECT_ROW: {
                updateSelection = true;

                const { value, ctrlKey, shiftKey } = action;
                let addToSelection = [value];

                if (!isMultiselect) {
                    draft.selectedValues = addToSelection;
                    draft.activeValue = value;
                    break;
                }

                const isSelected = state.selectedValues.includes(value);
                if (shiftKey) {
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
            case TABLE_CLEAR_SELECTION: {
                setActivePivotValue(null);
                if (deselectOnContainerClick) {
                    draft.selectedValues = [];
                    updateSelection = true;
                }
                break;
            }
            case TABLE_SET_ROW_SELECTED: {
                const { value, selected } = action;

                if (!selected)
                    pullFirst(draft.selectedValues, value);
                else
                    draft.selectedValues.push(value);

                updateSelection = true;
                break;
            }
            case TABLE_SELECT_ALL: {
                if (!isMultiselect) break;
                draft.selectedValues = values;
                updateSelection = true;
                break;
            }
            case TABLE_SET_ACTIVE_ROW: {
                setActivePivotValue(action.value);
                break;
            }
            case TABLE_CONTEXT_MENU: {
                const { value, ctrlKey } = action;

                if (!ctrlKey) {
                    setActivePivotValue(value);
                    const isSelected = state.selectedValues.includes(value);
                    if (deselectOnContainerClick && !isSelected) {
                        draft.selectedValues = value ? [value] : [];
                        updateSelection = true;
                    }
                }

                raiseContextMenu();
                break;
            }


            //Columns
            case TABLE_SET_COLUMN_WIDTH: {
                const { index, width } = action;
                const { minWidth } = options;

                const thisWidth = state.columnWidth[index];
                const nextWidth = state.columnWidth[index + 1];
                const availableWidth = thisWidth + nextWidth;
                const maxWidth = availableWidth - minWidth;

                const limitedWidth = _.clamp(width, minWidth, maxWidth);
                draft.columnWidth[index] = limitedWidth;
                draft.columnWidth[index + 1] = availableWidth - limitedWidth;
                break;
            }
            case TABLE_SET_COLUMN_ORDER: {
                draft.columnOrder = action.order;
                const count = action.order.length;

                if (state.columnWidth.length === count) break;
                draft.columnWidth = getDefaultWidth(count);
                break;
            }

            //Sorting
            case TABLE_SORT_BY: {
                const newPath = action.path;
                const { sort } = draft;

                if (sort.path === newPath && sort.order === sortOrder.Ascending)
                    sort.order = sortOrder.Descending;
                else
                    sort.order = sortOrder.Ascending;

                sort.path = newPath;
                updateItems();
                break;
            }

            //Filtering

            //Internal
            case TABLE_SET_COLUMN_COUNT: {
                draft.columnOrder = null;
                draft.columnWidth = getDefaultWidth(action.count);
                break;
            }
            case TABLE_SET_OPTION: {
                options[action.name] = action.value;
                break;
            }
            default:
                break;
        }

        if (updateSelection && !areArraysEqual(state.selectedValues, draft.selectedValues))
            raiseSelectionChange();
    })
}

//Rows
export const TABLE_SORT_BY = "TABLE_SORT_BY";
export const TABLE_SET_FILTER = "TABLE_SET_FILTER";
export const TABLE_SET_ROWS = "TABLE_SET_ROWS";
export const TABLE_ADD_ROW = "TABLE_ADD_ROW";
export const TABLE_DELETE_ROWS = "TABLE_DELETE_ROWS";
export const TABLE_REPLACE_ROW = "TABLE_REPLACE_ROW";
export const TABLE_SET_ROW_VALUE = "TABLE_SET_ROW_VALUE";
export const TABLE_PATCH_ROW = "TABLE_PATCH_ROW";

//Columns
export const TABLE_SET_COLUMN_WIDTH = "TABLE_SET_COLUMN_WIDTH"
export const TABLE_SET_COLUMN_ORDER = "TABLE_SET_COLUMN_ORDER";

//Selection
export const TABLE_SET_ROW_SELECTED = "TABLE_SET_ROW_SELECTED";
export const TABLE_SELECT_ROW = "TABLE_SELECT_ROW";
export const TABLE_CLEAR_SELECTION = "TABLE_CLEAR_SELECTION";
export const TABLE_SELECT_ALL = "TABLE_SELECT_ALL";
export const TABLE_SET_ACTIVE_ROW = "TABLE_SET_ACTIVE_ROW";
export const TABLE_CONTEXT_MENU = "TABLE_CONTEXT_MENU";

//Internal
const TABLE_SET_COLUMN_COUNT = "TABLE_SET_COLUMN_COUNT";
const TABLE_SET_OPTION = "TABLE_SET_OPTION";

export function contextMenu(value, ctrlKey) {
    return { type: TABLE_CONTEXT_MENU, value, ctrlKey };
}

export function setFilter(filter) {
    return { type: TABLE_SET_FILTER, filter };
}

export function patchRow(value, patch) {
    return { type: TABLE_PATCH_ROW, value, patch };
}

export function setRowValue(oldValue, newValue) {
    return { type: TABLE_SET_ROW_VALUE, oldValue, newValue };
}

export function replaceRow(value, newItem) {
    return { type: TABLE_REPLACE_ROW, value, newItem };
}

export function deleteRows(...values) {
    return { type: TABLE_DELETE_ROWS, values };
}

export function addRow(newItem) {
    return { type: TABLE_ADD_ROW, newItem };
}

export function setRows(items) {
    return { type: TABLE_SET_ROWS, items };
}

export function setColumnWidth(index, width) {
    return { type: TABLE_SET_COLUMN_WIDTH, index, width };
}

export function setColumnOrder(order) {
    return { type: TABLE_SET_COLUMN_ORDER, order };
}

export function sortBy(path) {
    return { type: TABLE_SORT_BY, path };
}

export function selectRow(value, ctrlKey = false, shiftKey = false) {
    return { type: TABLE_SELECT_ROW, value, ctrlKey, shiftKey };
}

export function setActiveRow(value) {
    return { type: TABLE_SET_ACTIVE_ROW, value };
}

export function clearSelection() {
    return { type: TABLE_CLEAR_SELECTION };
}

export function selectAll() {
    return { type: TABLE_SELECT_ALL };
}

export function setRowSelected(value, selected) {
    return { type: TABLE_SET_ROW_SELECTED, value, selected };
}

export function _setColumnCount(count) {
    return { type: TABLE_SET_COLUMN_COUNT, count };
}

export function _setOption(name, value) {
    return { type: TABLE_SET_OPTION, name, value };
}