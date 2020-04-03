import { createStore } from "redux"
import { composeWithDevTools } from "redux-devtools-extension";
import configureReducer from "./reducers";

const store = createStore(configureReducer(), composeWithDevTools());
store.asyncReducers = {};

export function injectAsyncReducer(store, name, reducer) {
    store.asyncReducers[name] = reducer;
    reloadReducer(store);
}

export function deleteAsyncReducer(store, name) {
    delete store.asyncReducers[name];
    reloadReducer(store);
}

function reloadReducer(store) {
    store.replaceReducer(configureReducer(store.asyncReducers));
}

export default store;