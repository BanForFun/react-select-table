import * as pgSelectors from "../selectors/paginationSelectors";
import * as selSelectors from "../selectors/selectionSelectors";
import * as itemSelectors from "../selectors/itemSelectors";

export default function Selectors(namespace, options) {
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);

    const _getParsedItems = itemSelectors.makeGetParsedItems(options);
    const _getFilteredItems = itemSelectors.makeGetFilteredItems(_getParsedItems, options);
    const getSortedItems = itemSelectors.makeGetSortedItems(_getFilteredItems)
    const getSortedValues = itemSelectors.makeGetSortedValues(getSortedItems, options);
    const getSearchIndex = itemSelectors.makeGetSearchIndex(getSortedItems, options);
    const getRowValues = itemSelectors.makeGetRowValues(options);

    return {
        getSelectionArg,

        getRowValues,
        getSortedItems,
        getSortedValues,
        getSearchIndex,

        getPageCount: pgSelectors.getPageCount,
        getActivePageIndex: pgSelectors.getActivePageIndex,
        getFirstVisibleIndex: pgSelectors.getFirstVisibleIndex
    };
}
