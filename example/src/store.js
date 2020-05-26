import { createStore } from "redux";
import { TableReducer } from "react-select-table";
import { devToolsEnhancer } from "redux-devtools-extension";

const store = createStore(
    TableReducer.createTable(
        "todos",
        { valueProperty: "id" },
        { pageSize: 6 }
    ),
    devToolsEnhancer()
);

export default store;