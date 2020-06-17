import React, {useEffect, useMemo} from 'react';
import withStore from "./withStore"
import useConstructor from "../hooks/useConstructor";
import {injectReducer, removeReducer} from "../store/configureStore";
import createTable from "../store/table";
import {tableOptions} from "../utils/optionUtils";
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {useSelector} from "react-redux";

function useTableProps(name) {
  const props = { };

  //Pagination
  const getPageCount = useMemo(makeGetPageCount, []);
  props.pageCount = useSelector(s => getPageCount(s[name]));

  return props;
}

export const TableNameContext = React.createContext();
TableNameContext.displayName = "TableName";

export default function withTable(name, options = null) {
    return Wrapped => {
        function WithTable(ownProps) {
            useConstructor(() => {
              const customOptions = { ...options, path: name };
              const reducer = createTable(name, customOptions);
              injectReducer(name, reducer);
            });

            useEffect(() => {
              //Return cleanup method
              return () => {
                delete tableOptions[name];
                removeReducer(name);
              };
            }, []);

            const props = useTableProps(name);
            return <TableNameContext.Provider value={name}>
                <Wrapped {...ownProps} {...props} />
            </TableNameContext.Provider>
        }

        return withStore(WithTable);
    }
}
