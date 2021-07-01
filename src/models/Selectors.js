import * as selSelectors from "../selectors/selectionSelectors";
import * as itemSelectors from "../selectors/itemSelectors";
import * as pgSelection from "../selectors/paginationSelectors";

export default function Selectors(namespace, options, utils) {
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);
    const getRowValues = itemSelectors.makeGetRowValues(utils);
    const getPageCount = pgSelection.getPageCount;

    return {
        getSelectionArg,
        getRowValues,
        getPageCount
    }
}
