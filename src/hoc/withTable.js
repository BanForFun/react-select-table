import React, { useMemo } from 'react';
import { makeGetPageCount } from "../selectors/paginationSelectors";
import { useSelector } from 'react-redux';
import withStore from './withStore';
import useTable from '../hooks/useTable';

export default function withTable(tableName, options = undefined) {
    return Wrapped => {
        function WithTable(ownProps) {
            useTable(tableName, options);
            const props = {}

            //Pagination
            const getPageCount = useMemo(makeGetPageCount, []);
            props.pageCount = useSelector(s => getPageCount(s[tableName]));

            return <Wrapped {...ownProps} {...props} />
        }

        return withStore(WithTable);
    }
}