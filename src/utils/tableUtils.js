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