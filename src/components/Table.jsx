
import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import TableCore from "./TableCore.jsx";
import InternalActions from "../models/internalActions.js";
import configureStore from "../store/configureStore.js";

const store = configureStore();

function Table({
    items,
    filter,
    itemParser,
    itemPredicate,
    ...params
}) {
    const { name } = params;

    const actions = useMemo(() =>
        new InternalActions(name), [name]);

    function useAutoDispatch(actionCreator, param) {
        useEffect(() => {
            if (param === undefined) return;
            store.dispatch(actionCreator(param));
        }, [actions, param]);
    }

    useAutoDispatch(actions.setFilter, filter);
    useAutoDispatch(actions.setRows, items);

    if (!store.asyncReducers[name]) return null;
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