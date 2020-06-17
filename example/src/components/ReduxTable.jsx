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

    return <div className="container">
        <h1>Redux table</h1>
        <TableCore
            className="table"
            name={tableNamespace}
            columns={columns}
            context={ReactReduxContext}
        />
        <div>Page:&nbsp;
            <input type="number" id="pageIndex"
                min={1} max={pageCount}
                value={currentPage}
                onChange={handlePageChange}
            />
            &nbsp;/ {pageCount}
        </div>
    </div>
}

export default ReduxTable;
