import _ from "lodash";
import {getFirstItem} from "./setUtils";
import {makeGetPaginatedItems, getPageCount} from "../selectors/paginationSelectors";
import TableActions from "../models/actions";

export const tableOptions = {};

function defaultItemFilter(item, filter) {
    if (!filter) return true;

    for (let key in filter) {
        if (item[key] !== filter[key])
            return false;
    }

    return true;
}

export const defaultEvents = {
    onContextMenu: () => { },
    onSelectionChange: () => { }
}

const defaultOptions = {
    itemParser: item => item,
    itemPredicate: defaultItemFilter,
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
    const { path, multiSelect } = _.defaults(options, defaultOptions);

    function formatSelection(selection) {
        if (multiSelect) return selection;
        return getFirstItem(selection) ?? null;
    }

    function getStateSlice(state) {
        return path ? _.get(state, path) : state;
    }

    //Assign utils
    options.utils = {
        actions: new TableActions(namespace),
        formatSelection,
        getStateSlice,

        //Selectors
        getPageCount,
        getPaginatedItems: makeGetPaginatedItems()
    }

    //Assign events
    options.events = {...defaultEvents};

    tableOptions[namespace] = Object.freeze(options);
    return options; //Object.freeze mutates object
}

export function getUtils(namespace) {
    return tableOptions[namespace].utils;
}
