
import React, { useCallback, useState, useEffect } from "react";
import { Provider } from "react-redux";
import PropTypes from "prop-types";
import TableCore, { defaultOptions } from "./TableCore";
import configureStore from '../store/configureStore';
import { setRows, setFilter, _setColumnCount } from "../store/table";

function Table(params) {
    const { items, columns, filter } = params;
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
        dispatch(_setColumnCount(columns.length)),
        [dispatch, columns]);

    useEffect(() =>
        dispatch(setFilter(filter)),
        [dispatch, filter]);

    if (!store) return null;

    return <Provider store={store}>
        <TableCore {...params} />
    </Provider>
}

const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    classNames: PropTypes.array
});

Table.propTypes = {
    name: PropTypes.string.isRequired,
    valueProperty: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    items: PropTypes.array,
    filter: PropTypes.object,
    itemParser: PropTypes.func,
    itemFilter: PropTypes.func,
    minWidth: PropTypes.number,
    isMultiselect: PropTypes.bool,
    deselectOnContainerClick: PropTypes.bool,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func
}

Table.defaultProps = {
    ...defaultOptions,
    onItemsOpen: () => { }
}

export default Table;