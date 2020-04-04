import React, { useState, useEffect } from 'react';
import _ from "lodash";
import PropTypes from "prop-types";
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import { Provider, connect } from 'react-redux';
import configureStore from '../store/configureStore';
import { setItems } from '../store/table';

const SfcTable = ({ name, options, columnWidth, columnOrder }) => {
    const orderedColumns = columnOrder.length ?
        _.sortBy(options.columns, col => columnOrder.indexOf(col.path)) :
        options.columns;

    const parsedColumns = orderedColumns.map((col, index) => {
        const props = {
            width: `${columnWidth[index].toFixed(2)}%`,
            id: col.key || col.path
        };

        return { ...col, props };
    });

    const params = {
        name, options,
        columns: parsedColumns
    }

    return (
        <div className="react-select-table">
            <Head {...params} />
            <table>
                <ColumnResizer {...params} />
                <Body {...params} />
            </table>
        </div>
    )
}

function mapStateToProps(state) {
    return _.pick(state, "columnWidth", "columnOrder");
}

const ConnectedTable = connect(mapStateToProps)(SfcTable);

function Table({ items, ...params }) {
    const [store, setStore] = useState();

    useEffect(() => {
        if (items) {
            const store = configureStore(params.options);
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

const optionsShape = {
    valueProperty: PropTypes.string.isRequired,
    columns: PropTypes.array.isRequired,
    itemParser: PropTypes.func,
    itemFilter: PropTypes.func,
    minWidth: PropTypes.number
}

Table.propTypes = {
    options: PropTypes.shape(optionsShape),
    name: PropTypes.string.isRequired
}

export default Table;