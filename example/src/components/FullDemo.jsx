import React, {useCallback, useState, useMemo, useEffect, useRef} from 'react'
import _ from "lodash";
import { Table, getTableUtils } from 'react-select-table';
import { useDispatch, useSelector } from 'react-redux';
import comments from "../data/comments";
import {tableNamespace} from "../store";

//Column properties:
//string title: Text shown in the header

//bool isHeader: Use th tag instead of the default td
//Default: false

//number defaultWidth: Default column width percentage
//Default: 100% / <Visible column count>

//string path: The row's property path for the value to be passed as the first argument to the render function
//If not specified: The row index will be passed to the render function

//function render: Modifies the content before displaying
//Arguments:
//1. Explained above
//2. The entire row
//3. Options object: It contains a className property which you can modify to set a custom class for the cell
//Should return the content to be displayed
//Default: value => value

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
            showSelectionRect={false}
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
