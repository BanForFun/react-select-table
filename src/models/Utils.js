import _ from "lodash";
import {useMemo} from "react";
import {createSelectorHook, createDispatchHook} from "react-redux";
import {bindActionCreators} from "redux";
import Actions from "./Actions";
import * as selectors from "../selectors/tableSelectors";

export default function Utils(namespace, options) {
    const getStateSlice = state =>
        options.path ? _.get(state, options.path) : state;

    const useSelector = createSelectorHook(options.context);
    const useDispatch = createDispatchHook(options.context);

    const actions = new Actions(namespace);

    return {
        actions,
        getStateSlice,

        getPaginatedItems: selectors.makeGetPaginatedItems(),
        getPageCount: selectors.makeGetPageCount(),
        getSelectionArg: selectors.makeGetSelectionArg(options),

        getItemValue: (slice, index) => {
            const item = slice.tableItems[index];
            return item ? item[options.valueProperty] : null;
        },

        useSelector: selector =>
            useSelector(state => selector(getStateSlice(state))),

        useActions: () => {
            const dispatch = useDispatch();
            return useMemo(() => bindActionCreators(actions, dispatch), [dispatch]);
        }
    }
}
