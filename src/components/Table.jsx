import React, { useState, useEffect } from 'react';
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import "./table.scss";
import { Provider, connect } from 'react-redux';
import configureStore from '../store/configureStore';
import { setItems } from '../store/table';

const SfcTable = () => {
    return (
        <div className="react-select-table">
            <Head />
            <table>
                <ColumnResizer />
                <Body />
            </table>
        </div>
    )
}

const ConnectedTable = connect()(SfcTable);

function Table({ items, ...params }) {
    const [store, setStore] = useState();

    useEffect(() => {
        if (items) {
            const store = configureStore();
            setStore(store);
        } else
            setStore(null);
    }, []);

    useEffect(() => {
        store && store.dispatch(setItems(items))
    }, [items, store]);

    if (store === undefined) return null;
    if (store === null)
        return <SfcTable {...params} />;

    return <Provider store={store}>
        <ConnectedTable {...params} />
    </Provider>
}

export default Table;