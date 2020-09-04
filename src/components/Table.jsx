
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import TableCore, {columnShape} from "./TableCore.jsx";
import InternalActions from "../models/internalActions.js";
import getStore, { reducerExists } from "../store/configureStore.js";

function useAutoDispatch(creator, param) {
    useEffect(() => {
        if (!creator) return;
        if (param === undefined) return;

        getStore().dispatch(creator(param));
    }, [creator, param]);
}

function Table({
    items,
    filter,
    page,
    pageSize,
    columnOrder,
    itemParser,
    itemPredicate,
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

    const actions = useMemo(() => {
        if (!isReady) return {};
        return new InternalActions(name);
    }, [name, isReady]);

    useAutoDispatch(actions.setFilter, filter);
    useAutoDispatch(actions.setRows, items);
    useAutoDispatch(actions.goToPage, page);
    useAutoDispatch(actions.setPageSize, pageSize);
    useAutoDispatch(actions.setColumnOrder, columnOrder);

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
    onColumnResizeEnd: PropTypes.func,
    onKeyDown: PropTypes.func,
    emptyPlaceholder: PropTypes.node,
    loadingIndicator: PropTypes.node,
    filter: PropTypes.any,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    page: PropTypes.number,
    pageSize: PropTypes.number
}
