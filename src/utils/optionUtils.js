import _ from "lodash";
import * as selectors from "../selectors/tableSelectors";
import TableActions from "../models/actions";

export const tableOptions = {};

export const defaultEvents = {
    onContextMenu: () => { },
    onSelectionChange: () => { }
}

const defaultOptions = {
    itemParser: item => item,
    itemPredicate: (item, filter) => !filter || _.isMatch(item, filter),
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
    const { path, valueProperty } = _.defaults(options, defaultOptions);

    const getStateSlice = state =>
        path ? _.get(state, path) : state;

    const getItemValue = (slice, index) =>
        index !== null ? slice.tableItems[index][valueProperty] : null;

    //Assign utils
    options.utils = {
        actions: new TableActions(namespace),
        getPaginatedItems: selectors.makeGetPaginatedItems(),
        getPageCount: selectors.makeGetPageCount(),
        getSelectionArg: selectors.makeGetSelectionArg(options),
        getStateSlice,
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
