import {applyMiddleware, createStore} from "redux";
import {createTable, eventMiddleware, setDefaultTableOptions } from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";
import {ReactReduxContext} from "react-redux";

export const tableNamespace = "todos";

setDefaultTableOptions({
    context: ReactReduxContext
});

const compose = composeWithDevTools({
    serialize: true
});

const reducer = createTable(tableNamespace, {
    valueProperty: "id",
    searchProperty: "name",
    constantWidth: false,
    multiSelect: true,
    multiSort: true,
    initState: {
        // pageSize: 10,
        // filter: {
        //     completed: true
        // }
    }
});


export default createStore(reducer, compose(applyMiddleware(eventMiddleware)));
