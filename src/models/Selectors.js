import * as pgSelectors from "../selectors/paginationSelectors";
import * as selSelectors from "../selectors/selectionSelectors";
import * as itemSelectors from "../selectors/itemSelectors";

export default function Selectors(namespace, options) {
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);

    const _getParsedItems = itemSelectors.makeGetParsedItems(options);
    const _getFilteredItems = itemSelectors.makeGetFilteredItems(_getParsedItems, options);
    const getSortedItems = itemSelectors.makeGetSortedItems(_getFilteredItems)
    const getItemCount = itemSelectors.makeGetItemCount(_getFilteredItems);
    const getSortedValues = itemSelectors.makeGetSortedValues(getSortedItems, options);
    const getSearchIndex = itemSelectors.makeGetSearchIndex(getSortedItems, options);
    const getItemValue = itemSelectors.makeGetItemValue(getSortedValues);

    const getPageCount = pgSelectors.makeGetPageCount(getItemCount);
    const getPaginatedItems = pgSelectors.makeGetPaginatedItems(getSortedItems);

    return {
        getSelectionArg,

        getSortedItems,
        getItemCount,
        getSortedValues,
        getSearchIndex,
        getItemValue,

        getPageCount,
        getPaginatedItems,
        getActivePageIndex: pgSelectors.getActivePageIndex,
        getFirstVisibleIndex: pgSelectors.getFirstVisibleIndex
    };
}
