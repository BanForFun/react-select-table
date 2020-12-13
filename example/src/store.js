import {applyMiddleware, createStore} from "redux";
import { createTable, eventMiddleware } from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";
import todos from "./todos";

export const tableNamespace = "todos";

const compose = composeWithDevTools({
    serialize: true
});

export default function setupStore() {
    const tableReducer = createTable(
        tableNamespace,
        {
            valueProperty: "id",
            scrollX: true,
            listBox: true,
            initState: {
                // pageSize: 8
            }
        }
    );

    return createStore(
        tableReducer,
        compose(applyMiddleware(eventMiddleware))
    );
};
