import { createStore, combineReducers, applyMiddleware } from "redux"
import { composeWithDevTools } from "redux-devtools-extension";
import eventMiddleware from "./eventMiddleware";

let store;
const asyncReducers = {};

export default function getStore() {
    //Store doesn't exists
    if (!store)
        throw new Error("Store was not initialized.");

    //Store exists
    return store;
}


function configureStore() {
    store = createStore(getReducer(), composeWithDevTools(
        applyMiddleware(eventMiddleware)));
}

function getReducer() {
    const isEmpty = !Object.keys(asyncReducers).length;
    return isEmpty ? s => s : combineReducers(asyncReducers);
}

function rebuildReducers() {
    store.replaceReducer(getReducer());
}

export function injectReducers(reducers) {
    Object.assign(asyncReducers, reducers);

    if (store)
        rebuildReducers();
    else
        configureStore();
}

export function removeReducers(namespaces) {
    namespaces.forEach(ns => delete asyncReducers[ns]);
    rebuildReducers();
}

export function reducerExists(namespace) {
    return !!asyncReducers[namespace];
}
