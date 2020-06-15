import {injectReducer, reducerExists, removeReducer} from "../store/configureStore";
import createTable from "../store/table";
import {tableOptions} from "../utils/optionUtils";
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {useSelector} from "react-redux";
import {useMemo, useEffect} from "react";
import useOnce from "./useOnce";

export default function useTable(name, options) {
  useOnce(() => {
    if (reducerExists(name)) return;
    const customOptions = { ...options, path: name };
    const reducer = createTable(name, customOptions);
    injectReducer(name, reducer);
  }, [name, options]);

  useEffect(() => {
    function dispose() {
      delete tableOptions[name];
      removeReducer(name);
    }

    return dispose;
  }, [name]);

  const props = { name };

  //Pagination
  const getPageCount = useMemo(makeGetPageCount, []);
  props.pageCount = useSelector(s => getPageCount(s[name]));

  return props;
}
