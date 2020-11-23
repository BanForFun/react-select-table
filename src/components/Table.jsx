
import React, { useEffect, useState, useMemo } from "react";
import { Provider, useDispatch } from "react-redux";
import TableCore, { columnShape } from "./TableCore.jsx";
import getStore, { reducerExists } from "../store/configureStore.js";
import PropTypes from "prop-types";
import Actions from "../models/actions";

function useAutoDispatch(creator, param) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!creator) return;
        if (param === undefined) return;

        dispatch(creator(param));
    }, [creator, param, dispatch]);
}

function Table({
    items,
    filter,
    page,
    pageSize,
    name,
    ...props
}) {
    const store = getStore();

    const [isReady, setReady] = useState(false);
    useEffect(() => {
        const updateReady = () =>
            setReady(reducerExists(name));

        //For the first table
        updateReady();

        //For subsequent tables
        store.subscribe(updateReady);
    }, [name]);

    const actions = useMemo(() =>
        isReady && new Actions(name),
        [name, isReady]
    );

    useAutoDispatch(actions.setFilter, filter);
    useAutoDispatch(actions.setRows, items);
    useAutoDispatch(actions.goToPage, page);
    useAutoDispatch(actions.setPageSize, pageSize);

    if (!isReady) return null;
    return <Provider store={store}>
        <TableCore {...props} name={name} />
    </Provider>
}

export default Table;

Table.propTypes = {
    name: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    items: PropTypes.array.isRequired,
    className: PropTypes.string,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onColumnsResizeEnd: PropTypes.func,
    onKeyDown: PropTypes.func,
    emptyPlaceholder: PropTypes.node,
    filter: PropTypes.any,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    initColumnWidths: PropTypes.arrayOf(PropTypes.number),
    page: PropTypes.number,
    pageSize: PropTypes.number,
    scrollFactor: PropTypes.number
}
