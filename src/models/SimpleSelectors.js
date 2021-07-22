import _ from "lodash";
import * as selSelectors from "../simpleSelectors/selectionSelectors";
import * as pgSelectors from "../simpleSelectors/paginationSelectors";

export default function SimpleSelectors(options) {
    const { makeGetSelectionArg, ...selection } = selSelectors;
    const pagination = pgSelectors;

    const getStateSlice = state => _.getOrSource(state, options.path);
    const getSelectionArg = makeGetSelectionArg(options);

    return {
        ...selection,
        ...pagination,
        getSelectionArg,
        getStateSlice
    }
}
