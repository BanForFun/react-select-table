import React, { useMemo } from 'react';
import { makeGetPageCount } from "../selectors/paginationSelectors";
import { useSelector } from 'react-redux';
import withStore from "./withStore"
import useEffectInit from '../hooks/useEffectInit';
import { reducerExists, injectReducer, removeReducer } from '../store/configureStore';
import { createTable } from '../store/table';
import { tableOptions } from '../utils/optionUtils';

export const TableNameContext = React.createContext();
TableNameContext.displayName = "TableName";

export function useTableProps(name, options) {
    useEffectInit(() => {
        if (reducerExists(name)) return;
        const customOptions = { ...options, path: name };
        const reducer = createTable(name, customOptions);
        injectReducer(name, reducer);

        return () => {
            delete tableOptions[name];
            removeReducer(name);
        }
    }, [name, options]);

    const props = {};

    //Pagination
    const getPageCount = useMemo(makeGetPageCount, []);
    props.pageCount = useSelector(s => getPageCount(s[name]));

    return props;
}

export default function withTable(name, options = null) {
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