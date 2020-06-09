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

export const defaultOptions = {
    itemParser: item => item,
    itemPredicate: defaultItemFilter,
    isMultiselect: true,
    isListbox: false,
    minColumnWidth: 3,
    valueProperty: "_id",
    scrollX: false,
    multiSort: false
};