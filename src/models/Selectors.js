import * as pgSelectors from "../selectors/paginationSelectors";
import * as selSelectors from "../selectors/selectionSelectors";
import * as itemSelectors from "../selectors/itemSelectors";

export default function Selectors(namespace, options) {
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);

    const getParsedItems = itemSelectors.makeGetParsedItems(options);
    const getFilteredItems = itemSelectors.makeGetFilteredItems(getParsedItems, options);
    const getSortedItems = itemSelectors.makeGetSortedItems(getFilteredItems)
    const getSortedValues = itemSelectors.makeGetSortedValues(getSortedItems, options);
    const getSearchIndex = itemSelectors.makeGetSearchIndex(getSortedItems, options);
    const getItemCount = itemSelectors.makeGetItemCount(getFilteredItems);
    const getItemValue = itemSelectors.makeGetItemValue(getSortedValues);

    const getVisibleRange = pgSelectors.makeGetVisibleRange(getItemCount);
    const getPageCount = pgSelectors.makeGetPageCount(getItemCount);
    const getPaginatedItems = pgSelectors.makeGetPaginatedItems(getVisibleRange, getSortedItems);

    return {
        getItemValue,
        getItemCount,
        getVisibleRange,
        getPageCount,
        getSelectionArg,
        getSortedItems,
        getSortedValues,
        getPaginatedItems,
        getSearchIndex,
        getItemPageIndex: pgSelectors.getItemPageIndex
    };
}
