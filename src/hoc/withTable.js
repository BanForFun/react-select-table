import React, { useMemo } from 'react';
import { makeGetPageCount } from "../selectors/paginationSelectors";
import { useSelector } from 'react-redux';
import withStore from "./withStore"
import useTable from "../hooks/useTable";

export const TableNameContext = React.createContext();
TableNameContext.displayName = "TableName";

export function useTableProps(tableName, options) {
    useTable(tableName, options);
    const props = {};

    //Pagination
    const getPageCount = useMemo(makeGetPageCount, []);
    props.pageCount = useSelector(s => getPageCount(s[tableName]));

    return props;
}

export default function withTable(tableName, options = undefined) {
    return Wrapped => {
        function WithTable(ownProps) {
            const props = useTableProps(tableName, options);

            return <TableNameContext.Provider value={tableName}>
                <Wrapped {...ownProps} {...props} />
            </TableNameContext.Provider>
        }

        return withStore(WithTable);
    }
}