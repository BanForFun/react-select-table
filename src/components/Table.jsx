import React, { useState, useEffect } from 'react';
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import "./table.scss";
import { Provider, connect } from 'react-redux';
import store from '../store/configureStore';
import createTableSlice from '../store/table';
import { bindActionCreators } from 'redux';

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

function mapStateToProps(state, { name }) {
    return state[name];
}

function mapDispatchToProps(dispatch, { actions }) {
    return bindActionCreators(actions, dispatch);
}

function Table(params) {
    const [actions, setActions] = useState();

    useEffect(() => {
        const { actions, dispose } = createTableSlice(params.name);
        setActions(actions);
        return dispose;
    }, [name]);

    if (!actions) return null;

    const ConnectedTable = connect(mapStateToProps, mapDispatchToProps)(SfcTable);
    return <Provider store={store}>
        <ConnectedTable {...params} actions={actions} />
    </Provider>
}


export default Table;