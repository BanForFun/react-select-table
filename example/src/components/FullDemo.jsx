import React, {useCallback, useState, useMemo, useEffect, useRef} from 'react'
import _ from "lodash";
import { Table, getTableUtils } from 'react-select-table';
import { useDispatch, useSelector } from 'react-redux';
import comments from "../data/comments";
import {tableNamespace} from "../store";

const extraComments = comments.splice(0, 200);

const columns = [
    {
        title: "A/I",
        isHeader: true,
        defaultWidth: 10
    },
    {
        title: "#",
        path: "id",
        isHeader: true,
        defaultWidth: 10
    },
    {
        title: "Post id",
        path: "postId",
        defaultWidth: 10
    },
    {
        title: "Name",
        path: "name",
        defaultWidth: 40,
        render: (name, comment, options) => {
            if (comment.highlighted)
                options.className="highlighted";

            return name;
        }
    },
    {
        title: "Email",
        path: "email",
        defaultWidth: 30,
        render: address => <a href={`mailto:${address}`}>{address}</a>
    }
];

const { actions } = getTableUtils(tableNamespace);
const buttonActions = {
    "Set items": actions.setItems(comments),
    "Clear items": actions.clearItems(),

    "Add items": actions.addItems(...extraComments),

    "Set error": actions.setError("An error occurred"),

    "Set filter": actions.setItemFilter({ completed: true }),
    "Clear filter": actions.setItemFilter({}),

    "Page size 10": actions.setPageSize(10),
    "Disable pagination": actions.setPageSize(0),

    "Start loading": actions.startLoading(),

    "Highlight items": actions.patchItems(
        { id: 11, highlighted: true },
        { id: 19, highlighted: true }
    ),

    "Patch values": actions.patchItemValues({ 9: 14, 14: 9 })
};

const logEvent = type =>
    (...args) => console.log(type, ...args);

function FullDemo() {
    const dispatch = useDispatch();

    const tableRef = useRef();

    useEffect(() => {
        dispatch(actions.setItems(comments));
    }, [dispatch]);

    const handleButtonClick = useCallback(e => {
        const action = buttonActions[e.target.innerText];
        dispatch(action);

        tableRef.current.focus();
    }, [dispatch]);

    const handleTableKeyDown = useCallback((e, selection) => {
        switch(e.keyCode) {
            case 46: //Delete
                dispatch(actions.deleteItems(...selection));
                break;
            default:
                break;
        }

    }, [dispatch]);

    return <>
        <Table
            ref={tableRef}
            emptyPlaceholder="No items"
            namespace={tableNamespace}
            columnOrder={[0, 1, 3, 4]}
            columns={columns}
            loadingIndicator="Loading..."
            autoFocus={true}
            onKeyDown={handleTableKeyDown}
            onContextMenu={logEvent("Context menu")}
            onColumnResizeEnd={logEvent("Columns Resized")}
            onSelectionChange={logEvent("Selection")}
            onItemsOpen={logEvent("Open")}
        />
        <div id="buttons">
            {_.map(buttonActions, (_, text) =>
                <button key={`action_${text}`}
                        onClick={handleButtonClick}
                >{text}</button>)}
        </div>
    </>
}

export default FullDemo;
