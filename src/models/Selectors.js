import * as pgSelectors from "../selectors/paginationSelectors";
import * as selSelectors from "../selectors/selectionSelectors";

export default function Selectors(namespace, options) {
    const getItemValue = (slice, index) => {
        const item = slice.tableItems[index];
        return item ? item[options.valueProperty] : null;
    };

    const getItemPage = (slice, index) =>
        slice.pageSize && Math.trunc(index / slice.pageSize);

    const getVisibleRange = pgSelectors.makeGetVisibleRange();
    const getPaginatedItems = pgSelectors.makeGetPaginatedItems(getVisibleRange);
    const getVirtualActiveIndex = pgSelectors.makeGetVirtualActiveIndex(getVisibleRange);
    const getPageCount = pgSelectors.makeGetPageCount();
    const getSelectionArg = selSelectors.makeGetSelectionArg(options);

    return {
        getItemValue,
        getItemPage,

        getVisibleRange,
        getPaginatedItems,
        getPageCount,
        getSelectionArg,
        getVirtualActiveIndex
    };
}
