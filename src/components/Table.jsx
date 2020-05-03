
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import TableCore from "./TableCore.jsx";
import {
    setRows,
    setFilter,
    setValueProperty,
    setMultiselect,
    setListboxMode,
    setMinColumnWidth
} from "../store/table";

function Table({
    items,
    filter,
    store,
    valueProperty,
    isMultiselect,
    isListbox,
    itemParser,
    itemPredicate,
    minColumnWidth,
    ...params
}) {
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
    useAutoDispatch(setMinColumnWidth, minColumnWidth);

    if (!store) return null;

    return <Provider store={store}>
        <TableCore {...params} />
    </Provider>
}

export default Table;

Table.propTypes = {
    ...TableCore.propTypes,
    valueProperty: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
    store: PropTypes.any.isRequired,
    filter: PropTypes.any,
    minColumnWidth: PropTypes.number,
    isMultiselect: PropTypes.bool,
    isListbox: PropTypes.bool
}