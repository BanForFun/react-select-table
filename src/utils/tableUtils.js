import { injectReducer, removeReducer } from "../store/configureStore";
import { createTable } from "../store/table";

export function initTable(tableName, options = undefined) {
    const reducer = createTable(tableName, undefined, options);
    injectReducer(tableName, reducer);
}

export function disposeTable(tableName) {
    removeReducer(tableName);
}