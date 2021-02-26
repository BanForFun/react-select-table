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
    const useSelector = createSelectorHook(context);
    const useDispatch = createDispatchHook(context);
    const useStore = createStoreHook(context);

    const actions = new Actions(namespace);

    const getStateSlice = state =>
        path ? _.get(state, path) : state;

    return {
        actions,

        //Selectors
        getPaginatedItems: pgSelectors.makeGetPaginatedItems(),
        getPageCount: pgSelectors.makeGetPageCount(),
        getIsActiveRowVisible: pgSelectors.makeGetIsActiveRowVisible(),
        getSelectionArg: selSelectors.makeGetSelectionArg(options),

        //Getters
        getStateSlice,

        getItemValue: (slice, index) => {
            const item = slice.tableItems[index];
            return item ? item[options.valueProperty] : null;
        },

        //Hooks
        useSelector: selector =>
            useSelector(state => selector(getStateSlice(state))),

        useSelectorGetter: selector => {
            const store = useStore();
            return useCallback(() =>
                selector(getStateSlice(store.getState())),
            [selector, store]
            );
        },

        useActions: () => {
            const dispatch = useDispatch();
            return useMemo(() =>
                bindActionCreators(actions, dispatch),
                [dispatch]
            );
        }
    }
}
