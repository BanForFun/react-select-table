import { createStore } from "redux"
import { composeWithDevTools } from "redux-devtools-extension";
import createTableReducer from "./table";

export default function configureStore() {
    const reducer = createTableReducer();
    const store = createStore(reducer, composeWithDevTools());
    return store;
}