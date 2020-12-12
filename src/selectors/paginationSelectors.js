import { createSelector } from "reselect";

export const makeGetPaginatedItems = () => createSelector(
    [
        slice => slice.tableItems,
        slice => slice.pageSize,
        slice => slice.pageIndex
    ],
    (items, pageSize, pageIndex) => {
        pageSize ||= items.length;

        const start = pageIndex * pageSize;
        const end = start + pageSize;

        return {
            startIndex: start,
            rows: items.slice(start, end)
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

