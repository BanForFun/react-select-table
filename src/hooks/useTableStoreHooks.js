import {useMemo, useCallback} from "react";
import {getTableSlice, tableOptions} from "../utils/optionUtils";
import {createDispatchHook, createSelectorHook} from "react-redux";
import {bindActionCreators} from "redux";
import TableActions from "../models/actions";

export default function useTableStoreHooks(ns) {
    const {context} = tableOptions[ns];

    //Dispatch
    const useDispatch = useMemo(() => createDispatchHook(context), [context]);
    const dispatch = useDispatch();

    const dispatchers = useMemo(() =>
        bindActionCreators(new TableActions(ns), dispatch),
        [ns, dispatch]
    );

    //Select
    const useRootSelector = useMemo(() => createSelectorHook(context), [context]);

    const useSelector = useCallback(selector =>
        useRootSelector(state => selector(getTableSlice(state, ns))),
        [ns, useRootSelector]
    );

    return {
        dispatchers,
        useSelector
    }
}
