import _ from "lodash";
import { injectReducer, removeReducer, reducerExists } from "../store/configureStore";
import { createTable } from "../store/table";
import { tableOptions } from "./optionUtils";

/**
 * Creates and injects a table reducer
 *
 * @deprecated since 2.4.0; use withTable HOC instead
 */
export function initTable(tableName, options = undefined) {
    if (reducerExists(tableName)) return;

    const reducer = createTable(tableName, options);
    injectReducer(tableName, reducer);
}

/**
 * Removes the injected table reducer
 *
 * @deprecated since 2.4.0; use withTable HOC instead
 */
export function disposeTable(tableName) {
    delete tableOptions[tableName];
    removeReducer(tableName);
}