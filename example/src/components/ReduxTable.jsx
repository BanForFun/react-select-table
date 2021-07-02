import React, {useCallback, useState, useMemo, useEffect, useRef} from 'react'
import _ from "lodash";
import { Table } from 'react-select-table';
import columns from '../columns';
import { useDispatch, useSelector } from 'react-redux';
import {
    tableActions as actions,
    tableNamespace as namespace
} from "../store";
import todos from "../todos";

const evenTodos = todos.filter(t => t.id % 2 === 0);
const oddTodos = todos.filter(t => t.id % 2 === 1);

function logEvent(type) {
    return (...args) => console.log(type, ...args);
}

function ReduxTable() {
    const dispatch = useDispatch();

    const items = useSelector(s => s.sortedItems);

    const [clipboard, setClipboard] = useState(null);

    const containerRef = useRef();

    useEffect(() => {
        dispatch(actions.setItems(oddTodos));
    }, [dispatch]);

    const buttonActions = useMemo(() => ({
        "Add even todos": actions.addItems(...evenTodos),

        "Set items": actions.setItems(todos),
        "Clear items": actions.clearItems(),

        "Set error": actions.setError("An error occurred"),

        "Set filter": actions.setItemFilter({ completed: true }),
        "Clear filter": actions.setItemFilter({}),

        "Page size 10": actions.setPageSize(10),
        "Disable pagination": actions.setPageSize(0),

        "Start loading": actions.startLoading(),

        "Patch items": actions.patchItems({
            id: 11,
            title: "Title 11",
            completed: true
        }, {
            id: 19,
            title: "Title 19",
            completed: false
        }),

        "Patch values": actions.setItemValues({
            9: 14,
            15: 9
        }),

        "Debug": actions.debug()
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
                const values = [...selection];
                setClipboard(values.map(value => items[value].data));
                dispatch(actions.deleteItems(...values));
                break;
            case 86: //V
                if (!clipboard) break;
                dispatch(actions.addItems(...clipboard));
                setClipboard(null);
                break;
        }
    }, [dispatch, clipboard, items]);

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
            namespace={namespace}
            className="rst-table"
            initColumnWidths={[10, 60, 10, 10]}
            // tableClass="table table-striped table-hover table-dark"
            theadClass=""
            columns={columns}
            loadingIndicator="Loading..."
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
