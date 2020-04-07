
import React, { useCallback, useState, useEffect } from "react";
import { Provider } from "react-redux";
import TableCore, { propTypes, defaultProps } from "./TableCore";
import configureStore from '../store/configureStore';
import { setRows, setFilter } from "../store/table";

function Table({ items, filter, ...params }) {
    const [store, setStore] = useState();

    const dispatch = useCallback(action => {
        if (!store) return;
        store.dispatch(action);
    }, [store]);

    useEffect(() => {
        const store = configureStore();
        setStore(store);
    }, []);

    useEffect(() =>
        dispatch(setRows(items)),
        [dispatch, items]);

    useEffect(() =>
        dispatch(setFilter(filter)),
        [dispatch, filter]);

    if (!store) return null;

    return <Provider store={store}>
        <TableCore {...params} />
    </Provider>
}

export default Table;

Table.propTypes = propTypes;
Table.defaultProps = defaultProps;