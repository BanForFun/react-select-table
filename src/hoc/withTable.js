import React, { useMemo } from 'react';
import { makeGetPageCount } from "../selectors/paginationSelectors";
import { useSelector } from 'react-redux';
import withStore from "./withStore"
import useTable from "../hooks/useTable";

export const TableNameContext = React.createContext();
TableNameContext.displayName = "TableName";

export function useTableProps(name, options) {
    useTable(name, options);
    const props = {};

    //Pagination
    const getPageCount = useMemo(makeGetPageCount, []);
    props.pageCount = useSelector(s => getPageCount(s[name]));

    return props;
}

export default function withTable(name, options = undefined) {
    return Wrapped => {
        function WithTable(ownProps) {
            const props = useTableProps(name, options);

            return <TableNameContext.Provider value={name}>
                <Wrapped {...ownProps} {...props} />
            </TableNameContext.Provider>
        }

        return withStore(WithTable);
    }
}