import { createSelector } from "reselect";

export const makeGetPaginatedItems = () => createSelector(
    [
        slice => slice.tableItems,
        slice => slice.pageSize,
        slice => slice.pageIndex
    ],
    (items, pageSize, pageIndex) => {
        pageSize ||= items.length;

        const startIndex = pageIndex * pageSize;
        const endIndex = startIndex + pageSize;

        return {
            startIndex,
            rows: items.slice(startIndex, endIndex)
        };
    }
)

export function getPageCount(slice) {
    const { pageSize } = slice;
    if (!pageSize) return 0;

    const itemCount = slice.tableItems.length;
    if (!itemCount) return 1;

    return Math.ceil(itemCount / pageSize);
}

