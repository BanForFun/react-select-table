import { createStore } from "redux";
import { createTable } from "react-select-table";
import { devToolsEnhancer } from "redux-devtools-extension";
import todos from "./todos";

const store = createStore(
    createTable(
        "todos",
        {
            valueProperty: "id",
            initItems: todos
        },
        { pageSize: 5 }
    ),
    devToolsEnhancer()
);

export default store;
