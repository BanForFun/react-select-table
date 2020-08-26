import _ from "lodash";

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
    initColCount: 0,
    initState: {},
    ...defaultEvents
};

export function setDefaultOptions(options) {
    Object.assign(defaultOptions, options);
}

export function setOptions(namespace, options) {
    _.defaults(options, defaultOptions);
    tableOptions[namespace] = options;
    return options;
}

export function getTablePath(namespace) {
    return tableOptions[namespace].path;
}
