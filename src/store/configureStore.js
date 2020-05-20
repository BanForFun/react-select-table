import { createStore, combineReducers } from "redux"
import { devToolsEnhancer } from "redux-devtools-extension";

const emptyReducer = state => state;

let store;

export default function configureStore() {
    store = createStore(emptyReducer, devToolsEnhancer());
    store.asyncReducers = {};
    return store;
}

function rebuildReducers() {
    const reducers = store.asyncReducers;
    const isEmpty = Object.keys(reducers).length === 0;

    store.replaceReducer(isEmpty
        ? emptyReducer
        : combineReducers(reducers)
    );
}

export function injectReducer(name, reducer) {
    store.asyncReducers[name] = reducer;
    rebuildReducers();
}

export function removeReducer(name) {
    delete store.asyncReducers[name];
    rebuildReducers();
}