
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import TableCore, { propTypes } from "./TableCore";
import configureStore from '../store/configureStore';
import { setRows, setFilter, setValueProperty } from "../store/table";

function Table({ items, filter, valueProperty, ...params }) {
    const [store, setStore] = useState();

    useEffect(() => {
        const store = configureStore();
        setStore(store);
    }, []);

    function useAutoDispatch(actionCreator, param) {
        useEffect(() => {
            if (!store || param === undefined) return;
            store.dispatch(actionCreator(param));
        }, [store, param]);
    }

    useAutoDispatch(setValueProperty, valueProperty);
    useAutoDispatch(setFilter, filter);
    useAutoDispatch(setRows, items);

    if (!store) return null;

    return <Provider store={store}>
        <TableCore {...params} />
    </Provider>
}

export default Table;

Table.propTypes = {
    ...propTypes,
    valueProperty: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
    filter: PropTypes.object,
    minColumnWidth: PropTypes.number,
    isMultiselect: PropTypes.bool,
    deselectOnContainerClick: PropTypes.bool,
    itemParser: PropTypes.func,
    itemFilter: PropTypes.func
}