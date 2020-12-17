import {applyMiddleware, createStore} from "redux";
import {createTable, eventMiddleware} from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";
import todos from "./todos";

export const tableNamespace = "todos";

const compose = composeWithDevTools({
    serialize: true
});

const options = {
    valueProperty: "id",
    scrollX: true,
    multiSelect: true
}

export default function setupStore() {
    const reducer = createTable(tableNamespace, options);
    return createStore(reducer, compose(applyMiddleware(eventMiddleware)));
}
