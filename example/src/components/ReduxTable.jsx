import React, {useCallback, useState} from 'react'
import _ from "lodash";
import { TableCore, TableActions, TablePagination } from 'react-select-table';
import columns from '../columns';
import { useDispatch, useSelector } from 'react-redux';
import {tableNamespace} from "../store";
import todos from "../todos";

const actions = new TableActions(tableNamespace);

function ReduxTable() {
    const dispatch = useDispatch();

    const keyedItems = useSelector(s => s.items);

    const [clipboard, setClipboard] = useState(null);

    const handleKeyDown = useCallback(e => {
        switch(e.keyCode) {
            case 49: //1
                dispatch(actions.setRows(todos));
                break;
            case 50: //2
                dispatch(actions.startLoading());
                break;
            case 51: //3
                dispatch(actions.setError("Error"));
                break;
            case 52: //4
                dispatch(actions.clearRows());
                break;
        }
    }, [dispatch]);

    const handleTableKeyDown = useCallback((e, selection) => {
        switch(e.keyCode) {
            case 46: //Delete
                dispatch(actions.deleteRows(...selection));
                break;
        }

        if (!e.ctrlKey) return;

        switch (e.keyCode) {
            case 88: //X
                setClipboard(_.values(_.pick(keyedItems, ...selection)));
                dispatch(actions.deleteRows(...selection));
                break;
            case 86: //V
                if (!clipboard) break;
                dispatch(actions.addRows(...clipboard));
                setClipboard(null);
                break;
        }
    }, [dispatch, clipboard, keyedItems]);

    return <div id="redux" onKeyDown={handleKeyDown}>
        <TableCore
            className="table"
            name={tableNamespace}
            columns={columns}
            loadingIndicator="Loading..."
            scrollFactor={0.5}
            onKeyDown={handleTableKeyDown}
        />
        <div className="py-3">
            <TablePagination ns={tableNamespace} />
        </div>
        <div>
            1 = Set items |
            2 = Start loading |
            3 = Set error |
            4 = Clear items
        </div>
    </div>
}

export default ReduxTable;
