import _ from "lodash";
import { injectReducer, removeReducer } from "../store/configureStore";
import { createTable } from "../store/table";
import { tableOptions } from "./optionUtils";

export function initTable(tableName, options = undefined) {
    const reducer = createTable(tableName, options);
    injectReducer(tableName, reducer);
}

export function disposeTable(tableName) {
    delete tableOptions[tableName];
    removeReducer(tableName);
}

export function initialItemsState(valueProperty, items) {
    const keyedItems = _.keyBy(items, valueProperty);
    return {
        isLoading: false,
        valueProperty,
        items: keyedItems
    }
}