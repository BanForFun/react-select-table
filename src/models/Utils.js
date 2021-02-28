import _ from "lodash";
import {useMemo, useCallback} from "react";
import {createDispatchHook, createSelectorHook, createStoreHook} from "react-redux";
import {bindActionCreators} from "redux";
import Actions from "./Actions";
import * as selSelectors from "../selectors/selectionSelectors";
import * as pgSelectors from "../selectors/paginationSelectors";

export default function Utils(namespace, options) {
    const { context, path } = options;

    //Create redux hooks
    const _useSelector = createSelectorHook(context);
    const _useDispatch = createDispatchHook(context);
    const _useStore = createStoreHook(context);

    const actions = new Actions(namespace);

    const getStateSlice = state =>
        path ? _.get(state, path) : state;

    const getItemValue = (slice, index) => {
        const item = slice.tableItems[index];
        return item ? item[options.valueProperty] : null;
    };

    const useSelector = selector =>
        _useSelector(state => selector(getStateSlice(state)))

    const useSelectorGetter = selector => {
        const store = _useStore();
        return useCallback(() =>
            selector(getStateSlice(store.getState())),
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

    const getVisibleRange = pgSelectors.makeGetVisibleRange();
    const getPaginatedItems = pgSelectors.makeGetPaginatedItems(getVisibleRange);
    const getPageCount = pgSelectors.makeGetPageCount();
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);

    return {
        actions,

        getStateSlice,
        getItemValue,

        useSelector,
        useSelectorGetter,
        useActions,

        getVisibleRange,
        getPaginatedItems,
        getPageCount,
        getSelectionArg
    }
}
