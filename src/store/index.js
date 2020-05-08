import { createStore, combineReducers } from "redux"
import { composeWithDevTools } from "redux-devtools-extension";

const emptyReducer = state => state;

const store = createStore(emptyReducer, composeWithDevTools());
store.asyncReducers = {};

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

export default store;