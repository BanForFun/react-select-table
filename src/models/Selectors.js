import * as selSelectors from "../selectors/selectionSelectors";
import * as itemSelectors from "../selectors/itemSelectors";

export default function Selectors(namespace, options) {
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);

    const getRowValues = itemSelectors.makeGetRowValues(options);

    return {
        getSelectionArg,

        getRowValues
    };
}
