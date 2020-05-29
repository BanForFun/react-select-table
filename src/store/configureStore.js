import { createStore, combineReducers } from "redux"
import { devToolsEnhancer } from "redux-devtools-extension";

let store;
const asyncReducers = {};

export default function getStore(doCreate = false) {
    //Store exists
    if (store) return store;
    //Store doesn't exist, don't create
    if (!doCreate) throw new Error("Store was not initialized.");
    //Store doesn't exist, create one
    configureStore();
    return store;
}

function configureStore() {
    store = createStore(getReducer(), devToolsEnhancer());
}

function getReducer() {
    const isEmpty = !Object.keys(asyncReducers).length;
    return isEmpty ? s => s : combineReducers(asyncReducers);
}

function rebuildReducers() {
    store.replaceReducer(getReducer());
}

export function injectReducer(name, reducer) {
    asyncReducers[name] = reducer;
    if (store) rebuildReducers();
    else configureStore();
}

export function removeReducer(name) {
    delete asyncReducers[name];
    rebuildReducers();
}

export function reducerExists(name) {
    return !!asyncReducers[name];
}