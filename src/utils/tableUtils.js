import _ from "lodash";
import Utils from "../models/Utils";
import Selectors from "../models/Selectors";
import Actions from "../models/Actions";

export const tableStorage = {};

export const defaultEvents = {
    onContextMenu: () => { },
    onSelectionChange: () => { }
}

const defaultOptions = {
    itemPredicate: _.isMatch,
    itemIndexer: str => str.normalize("NFD")[0].toLowerCase(),
    itemComparators: {},
    indexProperty: null,
    multiSelect: true,
    listBox: false,
    valueProperty: "id",
    constantWidth: false,
    minColumnWidth: 20,
    path: null,
    initState: {},
    context: null
};

export function setDefaultTableOptions(options) {
    Object.assign(defaultOptions, options);
}

export function setOptions(namespace, options) {
    _.defaults(options, defaultOptions);

    const actions = Actions(namespace, options);
    const utils = Utils(namespace, options, actions);
    const selectors = Selectors(namespace, options, utils);
    const events = _.clone(defaultEvents);

    tableStorage[namespace] = {
        options,
        actions,
        utils,
        selectors,
        events
    };

    return utils;
}

export function getTableUtils(namespace) {
    return tableStorage[namespace].utils;
}

export function getTableActions(namespace) {
    return tableStorage[namespace].actions;
}

export function getTableSelectors(namespace) {
    return tableStorage[namespace].selectors;
}
