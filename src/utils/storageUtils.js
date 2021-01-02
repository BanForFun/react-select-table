import _ from "lodash";
import Utils from "../models/Utils";

export const tableStorage = {};

export const defaultEvents = {
    onContextMenu: () => { },
    onSelectionChange: () => { }
}

const defaultOptions = {
    itemParser: item => item,
    itemPredicate: _.isMatch,
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

export function setOptions(namespace, options) {
    _.defaults(options, defaultOptions);
    Object.freeze(options);

    const storage = {
        options,
        utils: Utils(namespace, options),
        events: _.clone(defaultEvents)
    }

    tableStorage[namespace] = storage;
    return storage;
}

export function getTableUtils(namespace) {
    return tableStorage[namespace].utils;
}
