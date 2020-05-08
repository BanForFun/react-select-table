import produce from "immer";
import _ from "lodash";
import { pipe } from "lodash/fp";
import { sortOrders } from "../constants/enums";
import { sortTuple } from "../utils/mathUtils";
import { pullFirst, inArray, areArraysEqual } from "../utils/arrayUtils";
import { deleteKeys } from "../utils/objectUtils";
import InternalActions from "../models/internalActions";

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
    isMultiselect: true,
    isListbox: false,
    valueProperty: null,
    minColumnWidth: 3
};

function getDefaultWidth(count) {
    const width = 100 / count;
    return _.times(count, _.constant(width));
}

function validateInitialState(state) {
    const count = state.columnWidth.length;
    if (state.columnOrder && count === 0)
        state.columnWidth = getDefaultWidth(count);
}

export function createTable(tableName, initState = {}, options = {}) {
    _.defaults(initState, defaultState);
    validateInitialState(initState);

    _.defaults(options, defaultOptions);
    const eventHandlers = _.clone(defaultEventHandlers);

    const actions = new InternalActions(tableName);
    return (state = initState, action) => produce(state, draft => {
        const values = _.map(state.tableItems, state.valueProperty);
        let updateSelection = false;

        //Prefix methods that don't mutate draft state with an underscore
        const _parseItems = items =>
            _.map(items, options.itemParser);

        const _filterItems = items =>
            _.filter(items, i => options.itemPredicate(i, draft.filter));

        const _sortItems = items =>
            _.orderBy(items, [draft.sortPath], [draft.sortOrder]);

        const _transformItems = pipe(_parseItems, _filterItems, _sortItems);

        const updateItems = (updateSelection = false) => {
            //Update items   
            const newItems = _transformItems(draft.items);
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
            case "FORM_GROUP_SET_DATA":
            case actions.SET_ROWS: {
                const { data: items } = action;
                draft.items = _.keyBy(items, state.valueProperty);
                draft.isLoading = false;
                updateItems(true);
                break;
            }
            case actions.ADD_ROW: {
                const { newItem } = action;
                const value = newItem[state.valueProperty];
                draft.items[value] = newItem;
                updateItems();
                break;
            }
            case actions.DELETE_ROWS: {
                const { values } = action;
                deleteKeys(draft.items, values);
                deselectRows(values);
                updateItems();
                break;
            }
            case actions.REPLACE_ROW: {
                //Value property should not be changed
                draft.items[action.value] = action.newItem;
                updateItems();
                break;
            }
            case actions.SET_ROW_VALUE: {
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
            case actions.PATCH_ROW: {
                //Value property should not be changed
                const { value, patch } = action;
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
                clearSelection();
                break;
            }
            case actions.SORT_BY: {
                const newPath = action.path;

                if (state.sortPath === newPath && state.sortOrder === sortOrders.Ascending)
                    draft.sortOrder = sortOrders.Descending;
                else
                    draft.sortOrder = sortOrders.Ascending;

                draft.sortPath = newPath;
                updateItems();
                break;
            }
            case actions.SET_FILTER: {
                draft.filter = action.filter;
                updateItems(true);
                break;
            }

            //Selection
            case actions.SELECT_ROW: {
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
            case actions.CLEAR_SELECTION: {
                clearSelection(!state.isListbox);
                break;
            }
            case actions.SET_ROW_SELECTED: {
                const { value, selected } = action;

                if (!selected)
                    pullFirst(draft.selectedValues, value);
                else
                    draft.selectedValues.push(value);

                updateSelection = true;
                break;
            }
            case actions.SELECT_ALL: {
                if (!state.isMultiselect) break;
                draft.selectedValues = values;
                updateSelection = true;
                break;
            }
            case actions.SET_ACTIVE_ROW: {
                setActivePivotValue(action.value);
                break;
            }
            case actions.CONTEXT_MENU: {
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
            case actions.SET_MULTISELECT: {
                const { isMultiselect } = action;
                draft.isMultiselect = isMultiselect;

                if (!isMultiselect) {
                    draft.selectedValues = inArray(state.selectedValues[0]);
                    updateSelection = true;
                }
                break;
            }
            case actions.SET_LISTBOX_MODE: {
                draft.isListbox = action.isListbox;
                break;
            }

            //Options
            case actions.SET_VALUE_PROPERTY: {
                const { name } = action;
                if (state.valueProperty === name) break;

                //Update option
                draft.valueProperty = name;

                //Update items
                const items = Object.values(state.items);
                draft.items = _.keyBy(items, name);
                updateItems();

                //Update selection
                clearSelection();
                break;
            }


            //Columns
            case actions.SET_COLUMN_WIDTH: {
                const { index, width } = action;
                const { minColumnWidth } = state;

                const thisWidth = draft.columnWidth[index];
                const nextWidth = draft.columnWidth[index + 1];
                const availableWidth = thisWidth + nextWidth;
                const maxWidth = availableWidth - minColumnWidth;

                const limitedWidth = _.clamp(width, minColumnWidth, maxWidth);
                draft.columnWidth[index] = limitedWidth;
                draft.columnWidth[index + 1] = availableWidth - limitedWidth;
                break;
            }
            case actions.SET_COLUMN_ORDER: {
                draft.columnOrder = action.order;
                const count = action.order.length;

                if (state.columnWidth.length === count) break;
                draft.columnWidth = getDefaultWidth(count);
                break;
            }
            case actions.SET_MIN_COLUMN_WIDTH: {
                draft.minColumnWidth = action.percent;
                break;
            }

            //Internal
            case actions.SET_COLUMN_COUNT: {
                const { count } = action;
                if (state.columnWidth.length === count) break;

                draft.columnOrder = null;
                draft.columnWidth = getDefaultWidth(count);
                break;
            }
            case actions.SET_EVENT_HANDLER: {
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

function defaultItemFilter(item, filter) {
    if (!filter) return true;

    for (let key in filter) {
        if (item[key] !== filter[key])
            return false;
    }

    return true;
}

const defaultOptions = {
    itemParser: item => item,
    itemPredicate: defaultItemFilter
};

export const defaultEventHandlers = {
    onContextMenu: () => { },
    onSelectionChange: () => { }
}