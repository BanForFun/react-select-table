import _ from "lodash";
import * as selectors from "../selectors/tableSelectors";
import TableActions from "../models/actions";
import {createSelectorHook} from "react-redux";

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

export function setDefaultTableOptions(options) {
    Object.assign(defaultOptions, options);
}

function getUtils(namespace, options) {
    const getStateSlice = state =>
        options.path ? _.get(state, options.path) : state;

    const getItemValue = (slice, index) =>
        index === null ? null : slice.tableItems[index][options.valueProperty]

    const useRootSelector = createSelectorHook(options.context);
    const useSelector = selector =>
        useRootSelector(state => selector(getStateSlice(state)));

    return {
        actions: new TableActions(namespace),
        getPaginatedItems: selectors.makeGetPaginatedItems(),
        getPageCount: selectors.makeGetPageCount(),
        getSelectionArg: selectors.makeGetSelectionArg(options),
        getStateSlice,
        getItemValue,
        useSelector
    }
}

export function setOptions(namespace, options) {
    _.defaults(options, defaultOptions);

    //Assign utils
    options.utils = getUtils(namespace, options);

    //Assign events
    options.events = {...defaultEvents};

    tableOptions[namespace] = Object.freeze(options);
    return options; //Object.freeze mutates object
}

export function getTableUtils(namespace) {
    return tableOptions[namespace].utils;
}
