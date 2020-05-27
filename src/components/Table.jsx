
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import TableCore from "./TableCore.jsx";
import InternalActions from "../models/internalActions.js";
import getStore from "../store/configureStore.js";

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
    itemParser,
    itemPredicate,
    ...params
}) {
    const { name } = params;
    const store = getStore();

    const [isReady, setReady] = useState(false);
    useEffect(() => {
        const updateReady = () =>
            setReady(!!store.asyncReducers[name]);

        store.subscribe(updateReady);
        updateReady();
    }, [name]);

    const actions = useMemo(() => {
        if (!isReady) return {};
        return new InternalActions(name);
    }, [name, isReady]);

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