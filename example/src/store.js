import {applyMiddleware, createStore} from "redux";
import {createTable, eventMiddleware } from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";

export const tableNamespace = "comments";

const compose = composeWithDevTools({
    serialize: true
});

let customOptions = JSON.parse(sessionStorage.getItem("options"));
if (!customOptions) {
    customOptions = {title: "Default"};
    sessionStorage.setItem("options", JSON.stringify(customOptions));
}

const reducer = createTable(tableNamespace, {
    valueProperty: "id",
    searchProperty: "name",
    constantWidth: false,
    multiSelect: true,
    multiSort: true,
    listBox: false,
    initState: {
        pageSize: 10
    },
    ...customOptions
});


export default createStore(reducer, compose(applyMiddleware(eventMiddleware)));
