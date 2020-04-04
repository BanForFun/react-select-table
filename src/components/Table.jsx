import React, { useState, useEffect } from 'react';
import _ from "lodash";
import PropTypes from "prop-types";
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import { Provider, connect } from 'react-redux';
import configureStore from '../store/configureStore';
import { setItems } from '../store/table';

const SfcTable = ({ name, columns, columnWidth, columnOrder }) => {
    const orderedColumns = columnOrder.length ?
        _.sortBy(columns, col => columnOrder.indexOf(col.path)) :
        columns;

    const parsedColumns = orderedColumns.map((col, index) => {
        const props = {
            width: `${columnWidth[index].toFixed(2)}%`,
            id: col.key || col.path
        };

        return { ...col, props };
    });

    return (
        <div className="react-select-table">
            <Head name={name} columns={parsedColumns} />
            <table>
                <ColumnResizer columns={parsedColumns}
                    name={name} />
                <Body />
            </table>
        </div>
    )
}

function mapStateToProps(state) {
    return _.pick(state, "columnWidth", "columnOrder");
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