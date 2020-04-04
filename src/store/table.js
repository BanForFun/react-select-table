import produce from "immer";
import _ from "lodash";
import { pipe } from "lodash/fp";
import { sortOrder } from "../constants/enums";

export default function createTableReducer(options) {
    function getDefaultWidth(count) {
        const width = 100 / count;
        return _.times(count, _.constant(width));
    }

    const initState = {
        sort: {
            path: null,
            order: sortOrder.Ascending
        },
        columnOrder: [],
        columnWidth: getDefaultWidth(options.columns.length),
        filter: {},
        items: {},
        tableItems: []
    };

    return (state = initState, action) => produce(state, draft => {
        const parseItems = items =>
            _.map(items, options.itemParser);

        const filterItems = (items, filter = state.filter) =>
            _.filter(items, i => options.itemFilter(i, filter));

        const sortItems = (items, sort = state.sort) =>
            _.sortBy(items, [sort.path], [sort.order]);

        const transformItems = items => {
            const transform = pipe(parseItems, filterItems, sortItems);
            return transform(items);
        }

        switch (action.type) {
            case TABLE_SET_ITEMS:
                draft.items = _.keyBy(action.items, options.valueProperty);
                draft.tableItems = transformItems(action.items);
                break;
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
            default:
                return draft;
        }
    })
}

export const TABLE_SET_ITEMS = "TABLE_SET_ITEMS";
export const TABLE_SET_COLUMN_WIDTH = "TABLE_SET_COLUMN_WIDTH"
export const TABLE_SET_COLUMN_ORDER = "TABLE_SET_COLUMN_ORDER";

export function setItems(items) {
    return { type: TABLE_SET_ITEMS, items };
}

export function setColumnWidth(index, width) {
    return { type: TABLE_SET_COLUMN_WIDTH, index, width };
}

export function setColumnOrder(order) {
    return { type: TABLE_SET_COLUMN_ORDER, order };
}