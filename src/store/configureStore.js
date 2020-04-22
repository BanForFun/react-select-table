import { createStore } from "redux"
import { composeWithDevTools } from "redux-devtools-extension";
import { createTable } from "./table";

export default function configureStore(options = undefined) {
    const reducer = createTable(undefined, options);
    const store = createStore(reducer, composeWithDevTools());
    return store;
}