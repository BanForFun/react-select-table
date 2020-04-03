import produce from "immer";
import _ from "lodash";
import { pipe } from "lodash/fp";
import { sortOrder } from "../constants/enums";

export default function createTableReducer(options) {
    const initState = {
        sort: {
            path: null,
            order: sortOrder.Ascending
        },
        filter: {},
        items: {},
        tableItems: []
    };

    const config = {
        itemParser: item => item,
        itemFilter: () => true,
        valueProperty: "id",
        ...options
    }

    return (state = initState, action) => produce(state, draft => {
        const parseItems = items =>
            _.map(items, config.itemParser);

        const filterItems = (items, filter = state.filter) =>
            _.filter(items, i => config.itemFilter(i, filter));

        const sortItems = (items, sort = state.sort) =>
            _.sortBy(items, [sort.path], [sort.order]);

        const transformItems = items => {
            const transform = pipe(parseItems, filterItems, sortItems);
            return transform(items);
        }

        switch (action.type) {
            case TABLE_SET_ITEMS:
                draft.items = _.keyBy(action.items, config.valueProperty);
                draft.tableItems = transformItems(action.items);
                break;
            default:
                return draft;
        }
    })
}

export const TABLE_SET_ITEMS = "TABLE_SET_ITEMS";

export function setItems(items) {
    return { type: TABLE_SET_ITEMS, items };
}