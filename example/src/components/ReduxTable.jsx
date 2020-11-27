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

    const handleKeyDown = useCallback((e, selection) => {
        switch(e.keyCode) {
            case 46: //Delete
                dispatch(actions.deleteRows(...selection));
                break;
            case 112: //F1
                dispatch(actions.addRows(
                    {
                        "userId": 1,
                        "id": 3,
                        "title": "fugiat veniam minus",
                        "completed": false
                    },
                    {
                        "userId": 1,
                        "id": 4,
                        "title": "et porro tempora",
                        "completed": true
                    },
                    {
                        "userId": 1,
                        "id": 5,
                        "title": "laboriosam mollitia et enim quasi adipisci quia provident illum",
                        "completed": false
                    }
                ));
                break;
        }
    }, [dispatch]);

    return <div id="redux">
        <TableCore
            className="table"
            name={tableNamespace}
            columns={columns}
            context={ReactReduxContext}
            scrollFactor={0.5}
            onKeyDown={handleKeyDown}
        />
        <div className="py-3">
            Page: <input
                type="number"
                id="pageIndex"
                className="mx-2"
                min={1}
                max={pageCount}
                value={currentPage}
                onChange={handlePageChange}
            /> / {pageCount}
        </div>
        <div>
            F1 = Add items
        </div>
    </div>
}

export default ReduxTable;
