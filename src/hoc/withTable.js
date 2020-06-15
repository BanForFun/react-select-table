import React, {useEffect, useMemo} from 'react';
import withStore from "./withStore"
import useOnce from "../hooks/useOnce";
import {injectReducer, reducerExists, removeReducer} from "../store/configureStore";
import createTable from "../store/table";
import {tableOptions} from "../utils/optionUtils";
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {useSelector} from "react-redux";

function useTable(name, options) {
  useOnce(() => {
    if (reducerExists(name)) return;
    const customOptions = { ...options, path: name };
    const reducer = createTable(name, customOptions);
    injectReducer(name, reducer);
  }, [name, options]);

  useEffect(() => {
    //Return cleanup method
    return () => {
      delete tableOptions[name];
      removeReducer(name);
    };
  }, [name]);

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
            const props = useTable(name, options);

            return <TableNameContext.Provider value={name}>
                <Wrapped {...ownProps} {...props} />
            </TableNameContext.Provider>
        }

        return withStore(WithTable);
    }
}
