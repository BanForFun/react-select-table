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
    initState: {}
};

export function setDefaultOptions(options) {
    Object.assign(defaultOptions, options);
}

export function setOptions(namespace, options) {
    _.defaults(options, defaultOptions);
    Object.assign(options, defaultEvents);
    tableOptions[namespace] = options;
}

export function formatSelection(selection, namespace) {
    if (tableOptions[namespace].multiSelect)
        return selection;

    for (let value of selection)
        return value;

    return null;
}
