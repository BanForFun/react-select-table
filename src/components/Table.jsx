
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
    valueProperty,
    isMultiselect,
    isListbox,
    itemParser,
    itemPredicate,
    minColumnWidth,
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

    useAutoDispatch(actions.setValueProperty, valueProperty);
    useAutoDispatch(actions.setFilter, filter);
    useAutoDispatch(actions.setRows, items);
    useAutoDispatch(actions.setMultiselect, isMultiselect);
    useAutoDispatch(actions.setListboxMode, isListbox);
    useAutoDispatch(actions.setMinColumnWidth, minColumnWidth);

    if (!store) return null;
    return <Provider store={store}>
        <TableCore {...params} statePath={name} />
    </Provider>
}

export default Table;

Table.propTypes = {
    ...TableCore.propTypes,
    valueProperty: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
    filter: PropTypes.any,
    minColumnWidth: PropTypes.number,
    isMultiselect: PropTypes.bool,
    isListbox: PropTypes.bool
}