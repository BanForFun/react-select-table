
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import TableCore from "./TableCore.jsx";
import InternalActions from "../models/internalActions.js";
import configureStore from "../store/configureStore.js";

const store = configureStore();

function useAutoDispatch(creator, param) {
    useEffect(() => {
        if (param === undefined) return;
        store.dispatch(creator(param));
    }, [creator, param]);
}

function Table({
    items,
    filter,
    itemParser,
    itemPredicate,
    ...params
}) {
    const { name } = params;

    const [isReady, setReady] = useState(false);
    useEffect(() => {
        store.subscribe(() =>
            setReady(!!store.asyncReducers[name]));
    }, [name]);

    const actions = useMemo(() =>
        new InternalActions(name), [name]);

    useAutoDispatch(actions.setFilter, filter);
    useAutoDispatch(actions.setRows, items);

    if (!isReady) return null;
    return <Provider store={store}>
        <TableCore {...params} statePath={name} />
    </Provider>
}

export default Table;

Table.propTypes = {
    ...TableCore.propTypes,
    items: PropTypes.array.isRequired,
    filter: PropTypes.any
}