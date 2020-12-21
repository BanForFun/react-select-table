import React, {useCallback, useState, useMemo, useEffect} from 'react'
import _ from "lodash";
import { Table, TableActions } from 'react-select-table';
import columns from '../columns';
import { useDispatch, useSelector } from 'react-redux';
import {tableNamespace} from "../store";
import todos from "../todos";

const actions = new TableActions(tableNamespace);

function logEvent(type) {
    return (...args) => console.log(type, ...args);
}

function ReduxTable() {
    const dispatch = useDispatch();

    const keyedItems = useSelector(s => s.items);

    const [clipboard, setClipboard] = useState(null);

    useEffect(() => {
        dispatch(actions.setItems(todos));
    }, [dispatch]);

    const buttonActions = useMemo(() => ({
        "Set items": actions.setItems(todos),
        "Set error": actions.setError("Error"),
        "Clear items": actions.clearItems(),
        "Enable pagination": actions.setPageSize(8),
        "Disable pagination": actions.setPageSize(0),
        "Start loading": actions.startLoading()
    }), [])

    const handleTableKeyDown = useCallback((e, selection) => {
        switch(e.keyCode) {
            case 46: //Delete
                dispatch(actions.deleteItems(...selection));
                break;
        }

        if (!e.ctrlKey) return;

        switch (e.keyCode) {
            case 88: //X
                setClipboard(_.values(_.pick(keyedItems, ...selection)));
                dispatch(actions.deleteItems(...selection));
                break;
            case 86: //V
                if (!clipboard) break;
                dispatch(actions.addItems(...clipboard));
                setClipboard(null);
                break;
        }
    }, [dispatch, clipboard, keyedItems]);

    return <div id="example">
        <div className="pb-2">
            {_.map(buttonActions, (action, text) => {
                return <button
                    key={text}
                    className="btn btn-sm btn-primary mr-1"
                    onClick={() => dispatch(action)}
                >{text}</button>
            })}
        </div>
        <Table
            className="table"
            namespace={tableNamespace}
            columns={columns}
            loadingIndicator="Loading..."
            scrollFactor={0.5}
            onKeyDown={handleTableKeyDown}
            showSelectionRect={true}
            liveColumnResize={true}
            onContextMenu={logEvent("Context Menu")}
        />
    </div>
}

export default ReduxTable;
