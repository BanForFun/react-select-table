import {useMemo, useCallback} from "react";
import {createDispatchHook, createSelectorHook} from "react-redux";
import {bindActionCreators} from "redux";

import {tableOptions} from "../utils/optionUtils";

export default function useTableStoreHooks(ns) {
    const {context, utils} = tableOptions[ns];

    //Dispatch
    const useDispatch = useMemo(() => createDispatchHook(context), [context]);
    const dispatch = useDispatch();

    const dispatchers = useMemo(() =>
        bindActionCreators(utils.actions, dispatch),
        [utils, dispatch]
    );

    //Select
    const useRootSelector = useMemo(() => createSelectorHook(context), [context]);

    const useSelector = useCallback(selector =>
        useRootSelector(state => selector(utils.getStateSlice(state))),
        [utils, useRootSelector]
    );

    return {
        dispatchers,
        useSelector,
        utils
    }
}
