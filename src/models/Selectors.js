import * as selSelectors from "../selectors/selectionSelectors";
// import * as itemSelectors from "../selectors/itemSelectors";
import * as pgSelection from "../selectors/paginationSelectors";

export default function Selectors(namespace, options) {
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);
    const getActiveValue = selSelectors.getActiveValue;
    const getPageCount = pgSelection.getPageCount;

    return {
        getSelectionArg,
        getPageCount,
        getActiveValue
    }
}
