import _ from "lodash";
import TableActions from "./Actions";
import {createSelectorHook} from "react-redux";
import * as selectors from "../selectors/tableSelectors";

export default function Utils(namespace, options) {
    const getStateSlice = state =>
        options.path ? _.get(state, options.path) : state;

    const useRootSelector = createSelectorHook(options.context);

    return {
        actions: new TableActions(namespace),
        getPaginatedItems: selectors.makeGetPaginatedItems(),
        getPageCount: selectors.makeGetPageCount(),
        getSelectionArg: selectors.makeGetSelectionArg(options),
        getStateSlice,

        getItemValue: (slice, index) =>
            slice.tableItems[index][options.valueProperty],

        useSelector: selector =>
            useRootSelector(state => selector(getStateSlice(state)))
    }
}
