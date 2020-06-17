
import React, { useEffect, useMemo, useState, useContext } from "react";
import PropTypes from "prop-types";
import { Provider } from "react-redux";
import TableCore from "./TableCore.jsx";
import InternalActions from "../models/internalActions.js";
import getStore, { reducerExists } from "../store/configureStore.js";
import { TableNameContext } from "../hoc/withTable.js";
import useEither from "../hooks/useEither.js";

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
    itemParser,
    itemPredicate,
    name: propName,
    ...props
}) {
    const store = getStore();

    const contextName = useContext(TableNameContext);
    const name = useEither(propName, contextName);

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

    if (!isReady) return null;
    return <Provider store={store}>
        <TableCore {...props} name={name} />
    </Provider>
}

export default Table;

Table.propTypes = {
    ...TableCore.propTypes,
    items: PropTypes.array.isRequired,
    filter: PropTypes.any,
    page: PropTypes.number,
    pageSize: PropTypes.number
}
