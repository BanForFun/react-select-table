import {applyMiddleware, createStore} from "redux";
import { createTable, eventMiddleware } from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";
import todos from "./todos";

export const tableNamespace = "todos";

const store = createStore(
    createTable(tableNamespace,
        {
            valueProperty: "id",
            initItems: todos,
            scrollX: true,
            initState: {
                pageSize: 800
            }
        }
    ),
    composeWithDevTools(applyMiddleware(eventMiddleware))
);

export default store;
