
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import TableCore, { propTypes } from "./TableCore";
import configureStore from '../store/configureStore';
import {
    setRows,
    setFilter,
    setValueProperty,
    setMultiselect,
    setListboxMode,
    setPredicate,
    setParser
} from "../store/table";

function Table({
    items,
    filter,
    valueProperty,
    isMultiselect,
    isListbox,
    itemParser,
    itemPredicate,
    ...params
}) {
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
    useAutoDispatch(setMultiselect, isMultiselect);
    useAutoDispatch(setListboxMode, isListbox);
    useAutoDispatch(setParser, itemParser);
    useAutoDispatch(setPredicate, itemPredicate);

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
    isListbox: PropTypes.bool,
    itemParser: PropTypes.func,
    itemPredicate: PropTypes.func
}