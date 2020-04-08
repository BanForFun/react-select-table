import { createStore } from "redux"
import { composeWithDevTools } from "redux-devtools-extension";
import { createTable } from "./table";

export default function configureStore() {
    const reducer = createTable();
    const store = createStore(reducer, composeWithDevTools());
    return store;
}