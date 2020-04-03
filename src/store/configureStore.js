import { createStore } from "redux"
import { composeWithDevTools } from "redux-devtools-extension";
import createTableReducer from "./table";

export default function configureStore(config) {
    const reducer = createTableReducer(config);
    const store = createStore(reducer, composeWithDevTools());
    return store;
}