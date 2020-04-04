import React, { useState, useEffect } from 'react';
import PropTypes from "prop-types";
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import { Provider, connect } from 'react-redux';
import configureStore from '../store/configureStore';
import { setItems } from '../store/table';

const SfcTable = ({ name, columns }) => {


    return (
        <div className="react-select-table">
            <Head name={name}
                columns={columns} />
            <table>
                <ColumnResizer />
                <Body />
            </table>
        </div>
    )
}

function mapStateToProps(state) {
    return {};
}

const mapDispatchToProps = {}

const ConnectedTable = connect(mapStateToProps, mapDispatchToProps)(SfcTable);

ConnectedTable.propTypes = {
    columns: PropTypes.array.isRequired,
    name: PropTypes.string.isRequired
}

function Table({ items, ...params }) {
    const [store, setStore] = useState();

    useEffect(() => {
        if (items) {
            const store = configureStore({
                valueProperty: params.valueProperty,
                columnCount: params.columns.length
            });
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