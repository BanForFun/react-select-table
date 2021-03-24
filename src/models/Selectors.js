import * as pgSelectors from "../selectors/paginationSelectors";
import * as selSelectors from "../selectors/selectionSelectors";
import * as itemSelectors from "../selectors/itemSelectors";
import {getActivePageIndex, getFirstVisibleIndex} from "../selectors/paginationSelectors";

export default function Selectors(namespace, options) {
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);

    const getParsedItems = itemSelectors.makeGetParsedItems(options);
    const getFilteredItems = itemSelectors.makeGetFilteredItems(getParsedItems, options);
    const getSortedItems = itemSelectors.makeGetSortedItems(getFilteredItems)
    const getSortedValues = itemSelectors.makeGetSortedValues(getSortedItems, options);
    const getSearchIndex = itemSelectors.makeGetSearchIndex(getSortedItems, options);
    const getItemCount = itemSelectors.makeGetItemCount(getFilteredItems);
    const getItemValue = itemSelectors.makeGetItemValue(getSortedValues);

    const getPageCount = pgSelectors.makeGetPageCount(getItemCount);
    const getPaginatedItems = pgSelectors.makeGetPaginatedItems(getSortedItems);

    return {
        getItemValue,
        getItemCount,
        getPageCount,
        getSelectionArg,
        getSortedItems,
        getSortedValues,
        getPaginatedItems,
        getSearchIndex,
        getActivePageIndex,
        getFirstVisibleIndex
    };
}
