import React, { useMemo, useCallback } from 'react'
import { TableCore, TableActions, makeGetPageCount } from 'react-select-table';
import columns from '../columns';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import {tableNamespace} from "../store";

const actions = new TableActions(tableNamespace);

function ReduxTable() {
    const dispatch = useDispatch();

    const handlePageChange = useCallback(e => {
        const index = parseInt(e.target.value);
        dispatch(actions.goToPage(index));
    }, [dispatch]);

    const getPageCount = useMemo(makeGetPageCount, []);
    const pageCount = useSelector(getPageCount);
    const currentPage = useSelector(s => s.currentPage);
    const selection = useSelector(s => Array.from(s.selection.keys()));

    const handleKeyDown = e => {
        switch(e.keyCode) {
            case 46:
                dispatch(actions.deleteRows(...selection));
                break;
        }
    }

    return <div className="container" id="redux" onKeyDown={handleKeyDown}>
        <TableCore
            className="table"
            name={tableNamespace}
            columns={columns}
            context={ReactReduxContext}
        />
        <div>
            Page:
            <input
                type="number"
                id="pageIndex"
                className="mx-2"
                min={1}
                max={pageCount}
                value={currentPage}
                onChange={handlePageChange}
            />
            / {pageCount}
        </div>
        <div id="controls">

        </div>
    </div>
}

export default ReduxTable;
