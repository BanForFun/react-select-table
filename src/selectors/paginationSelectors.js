import { createSelector } from "reselect";

export const makeGetPaginatedItems = () => createSelector(
    [
        slice => slice.tableItems,
        slice => slice.pageSize,
        slice => slice.pageIndex
    ],
    (items, pageSize, pageIndex) => {
        if (!pageSize) return items;

        const start = pageIndex * pageSize;
        const end = (pageIndex + 1) * pageSize;
        return items.slice(start, end);
    }
)

export function getPageCount(slice) {
    const { pageSize } = slice;
    if (!pageSize) return 0;

    const itemCount = slice.tableItems.length;
    if (!itemCount) return 1;

    return Math.ceil(itemCount / pageSize);
}

export function getTopIndex(slice) {
    const { pageSize } = slice;
    return pageSize && (pageSize * slice.pageIndex);
}

