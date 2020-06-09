import _ from "lodash";
import { injectReducer, removeReducer, reducerExists } from "../store/configureStore";
import { createTable } from "../store/table";
import { tableOptions } from "./optionUtils";

/**
 * Creates and injects a table reducer
 *
 * @deprecated since 2.4.0; use withTable HOC instead
 */
export function initTable(namespace, options = undefined) {
    if (reducerExists(namespace)) return;

    const reducer = createTable(namespace, options);
    injectReducer(namespace, reducer);
}

/**
 * Removes the injected table reducer
 *
 * @deprecated since 2.4.0; use withTable HOC instead
 */
export function disposeTable(namespace) {
    delete tableOptions[namespace];
    removeReducer(namespace);
}