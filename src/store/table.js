import produce from "immer";
import _ from "lodash";
import { pipe } from "lodash/fp";
import { sortOrders } from "../constants/enums";
import { sortTuple } from "../utils/mathUtils";
import { pullFirst, inArray, areArraysEqual } from "../utils/arrayUtils";
import { deleteKeys } from "../utils/objectUtils";

const defaultState = {
    sortPath: null,
    sortOrder: sortOrders.Ascending,
    columnOrder: null,
    columnWidth: [],
    selectedValues: [],
    activeValue: null,
    filter: {},
    items: {},
    pivotValue: null,
    tableItems: [],
    isLoading: true,
    isMultiselect: true,
    isListbox: false,
    valueProperty: null,
    minColumnWidth: 3
};

export function createTable(initState = {}, options = {}) {
    function getDefaultWidth(count) {
        const width = 100 / count;
        return _.times(count, _.constant(width));
    }

    _.defaults(initState, defaultState);
    _.defaults(options, defaultOptions);

    const eventHandlers = {
        onContextMenu: () => { },
        onSelectionChange: () => { }
    };

    return (state = initState, action) => produce(state, draft => {
        const values = _.map(state.tableItems, state.valueProperty);
        let updateSelection = false;

        //Prefix methods that don't mutate draft state with an underscore
        const _parseItems = items =>
            _.map(items, options.itemParser);

        const _filterItems = items =>
            _.filter(items, i => options.itemFilter(i, draft.filter));

        const _sortItems = items =>
            _.orderBy(items, [draft.sortPath], [draft.sortOrder]);

        const updateItems = (updateSelection = false) => {
            //Update items
            const transform = pipe(_parseItems, _filterItems, _sortItems);
            const newItems = transform(draft.items);
            draft.tableItems = newItems;

            //Deselect values that no longer exist
            if (!updateSelection) return;
            const newValues = _.map(newItems, draft.valueProperty);
            const deselect = _.difference(draft.selectedValues, newValues);
            deselectRows(deselect);
        }

        const deselectRows = values => {
            //Update active value
            if (values.includes(state.activeValue))
                draft.activeValue = null;

            //Update selected values
            _.pullAll(draft.selectedValues, values);
            updateSelection = true;
        }

        const setActivePivotValue = value => {
            draft.pivotValue = value;
            draft.activeValue = value;
        }

        const raiseContextMenu = () => {
            const selected = [...draft.selectedValues];
            const active = inArray(draft.activeValue);
            eventHandlers.onContextMenu(state.isListbox ? active : selected);
        }

        const raiseSelectionChange = () =>
            eventHandlers.onSelectionChange([...draft.selectedValues]);

        const clearSelection = (clearSelectedValues = true) => {
            setActivePivotValue(null);

            if (!clearSelectedValues) return;
            draft.selectedValues = [];
            updateSelection = true;
        }

        switch (action.type) {
            //Items
            case TABLE_SET_ROWS: {
                const { items } = action;
                draft.items = _.keyBy(items, state.valueProperty);
                draft.isLoading = false;
                updateItems(true);
                break;
            }
            case TABLE_ADD_ROW: {
                const { newItem } = action;
                const value = newItem[state.valueProperty];
                draft.items[value] = newItem;
                updateItems();
                break;
            }
            case TABLE_DELETE_ROWS: {
                const { values } = action;
                deleteKeys(draft.items, values);
                deselectRows(values);
                updateItems();
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
                    [state.valueProperty]: newValue
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
            case TABLE_CLEAR_ROWS: {
                //Clear items
                draft.items = {};
                draft.tableItems = [];
                draft.isLoading = true;

                //Clear selection
                clearSelection();
                break;
            }

            //Selection
            case TABLE_SELECT_ROW: {
                updateSelection = true;

                const { value, ctrlKey, shiftKey } = action;
                let addToSelection = [value];

                if (!state.isMultiselect) {
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
                clearSelection(!state.isListbox);
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
                if (!state.isMultiselect) break;
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
                    if (!state.isListbox && !isSelected) {
                        draft.selectedValues = value ? [value] : [];
                        updateSelection = true;
                    }
                }

                raiseContextMenu();
                break;
            }
            case TABLE_SET_MULTISELECT: {
                const { isMultiselect } = action;
                draft.isMultiselect = isMultiselect;

                if (!isMultiselect) {
                    draft.selectedValues = inArray(state.selectedValues[0]);
                    updateSelection = true;
                }
                break;
            }
            case TABLE_SET_LISTBOX_MODE: {
                draft.isListbox = action.isListbox;
                break;
            }

            //Options
            case TABLE_SET_VALUE_PROPERTY: {
                //Update option
                draft.valueProperty = action.name;

                //Update items
                const items = Object.values(state.items);
                draft.items = _.keyBy(items, action.name);
                updateItems();

                //Update selection
                clearSelection();
                break;
            }


            //Columns
            case TABLE_SET_COLUMN_WIDTH: {
                const { index, width } = action;
                const { minColumnWidth } = state;

                const thisWidth = state.columnWidth[index];
                const nextWidth = state.columnWidth[index + 1];
                const availableWidth = thisWidth + nextWidth;
                const maxWidth = availableWidth - minColumnWidth;

                const limitedWidth = _.clamp(width, minColumnWidth, maxWidth);
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

                if (state.sortPath === newPath && state.sortOrder === sortOrders.Ascending)
                    draft.sortOrder = sortOrders.Descending;
                else
                    draft.sortOrder = sortOrders.Ascending;

                draft.sortPath = newPath;
                updateItems();
                break;
            }

            //Filtering
            case TABLE_SET_FILTER: {
                draft.filter = action.filter;
                updateItems(true);
                break;
            }

            //Internal
            case TABLE_SET_COLUMN_COUNT: {
                draft.columnOrder = null;
                draft.columnWidth = getDefaultWidth(action.count);
                break;
            }
            case TABLE_SET_EVENT_HANDLER: {
                eventHandlers[action.name] = action.callback;
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
export const TABLE_SET_ROWS = "TABLE_SET_ROWS";
export const TABLE_ADD_ROW = "TABLE_ADD_ROW";
export const TABLE_DELETE_ROWS = "TABLE_DELETE_ROWS";
export const TABLE_REPLACE_ROW = "TABLE_REPLACE_ROW";
export const TABLE_SET_ROW_VALUE = "TABLE_SET_ROW_VALUE";
export const TABLE_PATCH_ROW = "TABLE_PATCH_ROW";
export const TABLE_CLEAR_ROWS = "TABLE_CLEAR_ROWS";
export const TABLE_SORT_BY = "TABLE_SORT_BY";
export const TABLE_SET_FILTER = "TABLE_SET_FILTER";
export const TABLE_SET_VALUE_PROPERTY = "TABLE_SET_VALUE_PROPERTY";
// export const TABLE_SET_PARSE_FUNC = "TABLE_SET_PARSE_FUNC";
// export const TABLE_SET_FILTER_FUNC = "TABLE_SET_FILTER_FUNC";

//Columns
export const TABLE_SET_COLUMN_WIDTH = "TABLE_SET_COLUMN_WIDTH"
export const TABLE_SET_COLUMN_ORDER = "TABLE_SET_COLUMN_ORDER";
// export const TABLE_SET_MIN_COLUMN_WIDTH = "TABLE_SET_MIN_COLUMN_WIDTH";

//Selection
export const TABLE_SET_ROW_SELECTED = "TABLE_SET_ROW_SELECTED";
export const TABLE_SELECT_ROW = "TABLE_SELECT_ROW";
export const TABLE_CLEAR_SELECTION = "TABLE_CLEAR_SELECTION";
export const TABLE_SELECT_ALL = "TABLE_SELECT_ALL";
export const TABLE_SET_ACTIVE_ROW = "TABLE_SET_ACTIVE_ROW";
export const TABLE_CONTEXT_MENU = "TABLE_CONTEXT_MENU";
export const TABLE_SET_MULTISELECT = "TABLE_SET_MULTISELECT";
export const TABLE_SET_LISTBOX_MODE = "TABLE_SET_LISTBOX_MODE";

//Internal
const TABLE_SET_COLUMN_COUNT = "TABLE_SET_COLUMN_COUNT";
const TABLE_SET_EVENT_HANDLER = "TABLE_SET_EVENT_HANDLER";

export function setListboxMode(isListbox) {
    return { type: TABLE_SET_LISTBOX_MODE, isListbox };
}

export function setMultiselect(isMultiselect) {
    return { type: TABLE_SET_MULTISELECT, isMultiselect }
}

export function setValueProperty(name) {
    return { type: TABLE_SET_VALUE_PROPERTY, name };
}

export function clearRows() {
    return { type: TABLE_CLEAR_ROWS };
}

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

export function _setEventHandler(name, callback) {
    return { type: TABLE_SET_EVENT_HANDLER, name, callback };
}

function defaultItemFilter(item, filter) {
    for (let key in filter) {
        if (item[key] !== filter[key])
            return false;
    }

    return true;
}

const defaultOptions = {
    itemParser: item => item,
    itemFilter: defaultItemFilter
};

export const defaultEventHandlers = {
    onContextMenu: () => { },
    onSelectionChange: () => { }
}