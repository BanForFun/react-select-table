import React, { useEffect, useMemo, useCallback } from 'react'
import { TableCore, TableActions, makeGetPageCount } from 'react-select-table';
import columns from '../columns';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import todos from '../todos';

const actions = new TableActions("todos");

function ReduxTable() {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(actions.setRows(todos))
    }, [dispatch]);

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
            name="todos"
            columns={columns}
            context={ReactReduxContext}
        />
        <div>Page:&nbsp;
            <input
                type="number"
                id="pageIndex"
                value={currentPage}
                onChange={handlePageChange}
            />&nbsp;
            / {pageCount}
        </div>
    </div>
}

export default ReduxTable;