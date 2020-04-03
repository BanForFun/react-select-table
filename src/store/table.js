import { createSlice } from "@reduxjs/toolkit";
import headReducer from "./headReducer";
import bodyReducer from "./bodyReducer";
import store, { injectAsyncReducer, deleteAsyncReducer } from "./configureStore";

const initialState = {
    items: {},
    tableItems: []
}

function createTableSlice(name) {
    const slice = createSlice({
        name,
        initialState,
        reducer: {
            ...headReducer,
            ...bodyReducer
        }
    });

    injectAsyncReducer(store, name, slice.reducer);
    return {
        actions: slice.actions,
        dispose: () => deleteAsyncReducer(store, name)
    };
}

export default createTableSlice;