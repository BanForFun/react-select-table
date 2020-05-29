import _ from "lodash";
import { injectReducer, removeReducer, reducerExists } from "../store/configureStore";
import { createTable } from "../store/table";
import { tableOptions } from "./optionUtils";

export function initTable(tableName, options = undefined) {
    if (reducerExists(tableName)) return;

    const reducer = createTable(tableName, options);
    injectReducer(tableName, reducer);
}

export function disposeTable(tableName) {
    delete tableOptions[tableName];
    removeReducer(tableName);
}