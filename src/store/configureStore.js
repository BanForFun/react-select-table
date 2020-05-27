import { createStore, combineReducers } from "redux"
import { devToolsEnhancer } from "redux-devtools-extension";

let store;

const emptyReducer = state => state;

export default function getStore() {
    if (!store) {
        store = createStore(emptyReducer, devToolsEnhancer());
        store.asyncReducers = {};
    }

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
    getStore().asyncReducers[name] = reducer;
    rebuildReducers();
}

export function removeReducer(name) {
    delete store.asyncReducers[name];
    rebuildReducers();
}
