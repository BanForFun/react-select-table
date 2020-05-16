import produce from "immer";
import _ from "lodash";
import { pipe } from "lodash/fp";
import { sortOrders } from "../constants/enums";
import { sortTuple } from "../utils/mathUtils";
import { pullFirst, inArray, areArraysEqual } from "../utils/arrayUtils";
import { deleteKeys } from "../utils/objectUtils";
import actions from "../models/internalActions";
import { defaultOptions, tableOptions } from "../utils/optionUtils";

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
    isLoading: true
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

export function createTable(tableName, options = {}, initState = {}) {
    _.defaults(initState, defaultState);
    validateInitialState(initState);

    _.defaults(options, defaultOptions);
    tableOptions[tableName] = options;

    const eventHandlers = _.clone(defaultEventHandlers);

    return (state = initState, action) => produce(state, draft => {
        if (action.table !== tableName) return;
        const { valueProperty, isListbox, isMultiselect } = options;

        const values = _.map(state.tableItems, valueProperty);
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
            const newValues = _.map(newItems, valueProperty);
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
            eventHandlers.onContextMenu(isListbox ? active : selected);
        }

        const raiseSelectionChange = () =>
            eventHandlers.onSelectionChange([...draft.selectedValues]);

        const clearSelection = (clearSelectedValues = true) => {
            setActivePivotValue(null);

            if (!clearSelectedValues) return;
            draft.selectedValues = [];
            updateSelection = true;
        }

        const { payload } = action;
        switch (action.type) {
            //Items
            case "FORM_GROUP_SET_DATA":
            case actions.SET_ROWS: {
                const { data: items } = payload;
                draft.items = _.keyBy(items, valueProperty);
                draft.isLoading = false;
                updateItems(true);
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
                clearSelection();
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
                updateItems(true);
                break;
            }

            //Selection
            case actions.SELECT_ROW: {
                updateSelection = true;

                const { value, ctrlKey, shiftKey } = payload;
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
            case actions.CLEAR_SELECTION: {
                clearSelection(!isListbox);
                break;
            }
            case actions.SET_ROW_SELECTED: {
                const { value, selected } = payload;

                if (!selected)
                    pullFirst(draft.selectedValues, value);
                else
                    draft.selectedValues.push(value);

                updateSelection = true;
                break;
            }
            case actions.SELECT_ALL: {
                draft.selectedValues = values;
                updateSelection = true;
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
                    if (!isListbox && !isSelected) {
                        draft.selectedValues = value ? [value] : [];
                        updateSelection = true;
                    }
                }

                raiseContextMenu();
                break;
            }

            //Columns
            case actions.SET_COLUMN_WIDTH: {
                const { index, width } = payload;
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
                const { order } = payload;
                draft.columnOrder = order;
                const count = order.length;

                if (state.columnWidth.length === count) break;
                draft.columnWidth = getDefaultWidth(count);
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

        if (updateSelection && !areArraysEqual(state.selectedValues, draft.selectedValues))
            raiseSelectionChange();
    })
}

export const defaultEventHandlers = {
    onContextMenu: () => { },
    onSelectionChange: () => { }
}