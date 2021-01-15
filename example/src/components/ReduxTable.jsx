import React, {useCallback, useState, useMemo, useEffect, useRef} from 'react'
import _ from "lodash";
import { Table } from 'react-select-table';
import columns from '../columns';
import { useDispatch, useSelector } from 'react-redux';
import { tableUtils, tableNamespace } from "../store";
import todos from "../todos";

const { actions } = tableUtils;

function logEvent(type) {
    return (...args) => console.log(type, ...args);
}

function ReduxTable() {
    const dispatch = useDispatch();

    const keyedItems = useSelector(s => s.items);

    const [clipboard, setClipboard] = useState(null);

    const containerRef = useRef();

    useEffect(() => {
        dispatch(actions.setItems(todos));
    }, [dispatch]);

    const buttonActions = useMemo(() => ({
        "Set items": actions.setItems(todos),
        "Set error": actions.setError("Error"),
        "Clear error": actions.setError(null),
        "Clear items": actions.clearItems(),
        "Page size 8": actions.setPageSize(8),
        "Page size 10": actions.setPageSize(10),
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
        <div>
            {_.map(buttonActions, (action, text) => {
                function handleClick() {
                    dispatch(action);
                    containerRef.current.focus();
                }

                return <button
                    key={text}
                    className="btn btn-sm btn-primary mr-1 mb-2"
                    onClick={handleClick}
                >{text}</button>
            })}
        </div>
        <Table
            containerRef={containerRef}
            emptyPlaceholder="No items"
            namespace={tableNamespace}
            columns={columns}
            loadingIndicator="Loading..."
            scrollFactor={0.5}
            autoFocus={true}
            onKeyDown={handleTableKeyDown}
            showSelectionRect={true}
            onContextMenu={logEvent("ContextMenu")}
            onSelectionChange={logEvent("Selection")}
            onItemsOpen={logEvent("Open")}
        />
    </div>
}

export default ReduxTable;
