import {applyMiddleware, createStore} from "redux";
import { createTable, eventMiddleware } from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";
import todos from "./todos";

export const tableNamespace = "todos";

export default function setupStore() {
    const tableReducer = createTable(
        tableNamespace,
        {
            valueProperty: "id",
            initItems: todos,
            scrollX: true,
            initState: {
                pageSize: 8
            }
        }
    );

    return createStore(
        tableReducer,
        composeWithDevTools(applyMiddleware(eventMiddleware))
    );
};
