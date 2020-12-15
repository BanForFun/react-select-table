import _ from "lodash";
import {getFirstItem} from "./setUtils";
import {makeGetPaginatedItems} from "../selectors/paginationSelectors";
import TableActions from "../models/actions";

export const tableOptions = {};

export const defaultEvents = {
    onContextMenu: () => { },
    onSelectionChange: () => { }
}

const defaultOptions = {
    itemParser: item => item,
    itemPredicate: (item, filter) => filter ? _.isMatch(item, filter) : true,
    multiSelect: true,
    listBox: false,
    minColumnWidth: 3,
    valueProperty: "id",
    scrollX: false,
    multiSort: false,
    path: null,
    initState: {},
    context: null
};

export function setDefaultOptions(options) {
    Object.assign(defaultOptions, options);
}

export function setOptions(namespace, options) {
    const {
        path,
        multiSelect,
        valueProperty
    } = _.defaults(options, defaultOptions);

    const formatSelection = selection => {
        if (multiSelect) return selection;
        return getFirstItem(selection) ?? null;
    }

    const getStateSlice = state =>
        path ? _.get(state, path) : state;

    const getPageCount = slice => {
        const { pageSize } = slice;
        if (!pageSize) return 0;

        const itemCount = slice.tableItems.length;
        if (!itemCount) return 1;

        return Math.ceil(itemCount / pageSize);
    }

    const getItemValue = (slice, index) =>
        index !== null ? slice.tableItems[index][valueProperty] : null;

    //Assign utils
    options.utils = {
        actions: new TableActions(namespace),
        getPaginatedItems: makeGetPaginatedItems(),
        formatSelection,
        getStateSlice,
        getPageCount,
        getItemValue
    }

    //Assign events
    options.events = {...defaultEvents};

    tableOptions[namespace] = Object.freeze(options);
    return options; //Object.freeze mutates object
}

export function getUtils(namespace) {
    return tableOptions[namespace].utils;
}
