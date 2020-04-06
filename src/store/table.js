import produce from "immer";
import _ from "lodash";
import { pipe } from "lodash/fp";
import { sortOrder } from "../constants/enums";
import { sortTuple } from "../utils/mathUtils";

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
    tableItems: []
};

export default function createTableReducer() {
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

        //Prefix methods that don't mutate draft state with an underscore
        const _parseItems = items =>
            _.map(items, options.itemParser);

        const _filterItems = (items, filter = state.filter) =>
            _.filter(items, i => options.itemFilter(i, filter));

        const _sortItems = (items, sort = state.sort) =>
            _.orderBy(items, [sort.path], [sort.order]);

        const transformItems = items => {
            const transform = pipe(_parseItems, _filterItems, _sortItems);
            draft.tableItems = transform(items);
        }

        const deselectRows = values => {
            const { activeValue, selectedValues } = state;

            //Update active value
            if (values.includes(activeValue))
                draft.activeValue = null;

            //Update selected values
            draft.selectedValues = _.difference(selectedValues, values);
        }

        switch (action.type) {
            //Items
            case TABLE_SET_ITEMS: {
                draft.items = _.keyBy(action.items, valueProperty);
                transformItems(action.items);
                break;
            }

            //Selection
            case TABLE_SELECT_ROW: {
                const { value, ctrlKey, shiftKey } = action;
                let addToSelection = [value];

                if (!isMultiselect) {
                    draft.selectedValues = addToSelection;
                    draft.activeValue = value;
                    break;
                }

                const isSelected = state.selectedValues.includes(value);
                let updateActiveValue = true;

                if (shiftKey) {
                    const values = _.map(state.tableItems, valueProperty);
                    const pivotIndex = values.indexOf(state.activeValue);
                    const newIndex = values.indexOf(value);

                    const [startIndex, endIndex] = sortTuple(pivotIndex, newIndex);
                    addToSelection = values.slice(startIndex, endIndex + 1);
                    updateActiveValue = false;
                } else if (ctrlKey && isSelected) {
                    _.pull(draft.selectedValues, value);
                    addToSelection = null;
                }

                if (ctrlKey)
                    draft.selectedValues.push(...addToSelection);
                else
                    draft.selectedValues = addToSelection;

                if (updateActiveValue)
                    draft.activeValue = value;

                break;
            }
            case TABLE_CLEAR_SELECTION: {
                draft.activeValue = null;
                if (deselectOnContainerClick)
                    draft.selectedValues = [];
                break;
            }
            case TABLE_SET_ROW_SELECTED: {
                const { value, selected } = action;
                const values = [value];

                if (!selected) {
                    deselectRows(values);
                    break;
                }

                //Row to be selected
                if (!isMultiselect)
                    draft.selectedValues = values;
                else
                    draft.selectedValues.push(value);

                break;
            }
            case TABLE_SELECT_ALL: {
                draft.selectedValues = _.map(state.tableItems, valueProperty);
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
                const filteredItems = _filterItems(_parseItems(state.items));
                draft.tableItems = _sortItems(filteredItems, sort);
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
                return draft;
        }
    })
}

//Public actions

export const TABLE_SET_ITEMS = "TABLE_SET_ITEMS";
export const TABLE_SET_COLUMN_WIDTH = "TABLE_SET_COLUMN_WIDTH"
export const TABLE_SET_COLUMN_ORDER = "TABLE_SET_COLUMN_ORDER";
export const TABLE_SET_ROW_SELECTED = "TABLE_SET_ROW_SELECTED";
export const TABLE_SELECT_ALL = "TABLE_SELECT_ALL";
export const TABLE_SORT_BY = "TABLE_SORT_BY";
export const TABLE_SELECT_ROW = "TABLE_SELECT_ROW";
export const TABLE_CLEAR_SELECTION = "TABLE_CLEAR_SELECTION";

export function setItems(items) {
    return { type: TABLE_SET_ITEMS, items };
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

export function selectItem(value, ctrlKey = false, shiftKey = false) {
    return { type: TABLE_SELECT_ROW, value, ctrlKey, shiftKey };
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


//Internal actions

export const TABLE_SET_COLUMN_COUNT = "__TABLE_SET_COLUMN_COUNT__";
export const TABLE_SET_OPTION = "__TABLE_SET_OPTION__";

export function _setColumnCount(count) {
    return { type: TABLE_SET_COLUMN_COUNT, count };
}

export function _setOption(name, value) {
    return { type: TABLE_SET_OPTION, name, value };
}