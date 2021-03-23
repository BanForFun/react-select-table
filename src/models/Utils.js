import _ from "lodash";
import {useMemo, useCallback} from "react";
import {createDispatchHook, createSelectorHook, createStoreHook} from "react-redux";
import {bindActionCreators} from "redux";

export default function Utils(namespace, options, actions) {
    const { context, path } = options;

    //Create redux hooks
    const _useSelector = createSelectorHook(context);
    const _useDispatch = createDispatchHook(context);
    const _useStore = createStoreHook(context);

    const getStateSlice = state => _.getOrSource(state, path);

    const useSelector = (selector, ...args) =>
        _useSelector(state => selector(getStateSlice(state), ...args));

    const useSelectorGetter = (selector) => {
        const store = _useStore();
        return useCallback((...args) =>
            selector(getStateSlice(store.getState()), ...args),
            [selector, store]
        );
    }

    const useActions = () => {
        const dispatch = _useDispatch();
        return useMemo(() =>
            bindActionCreators(actions, dispatch),
            [dispatch]
        );
    }

    return {
        getStateSlice,

        useSelector,
        useSelectorGetter,
        useActions
    }
}
