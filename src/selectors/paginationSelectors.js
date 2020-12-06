import { createSelector } from "reselect";

export const makeGetPageCount = () => createSelector(
    [
        state => state.tableItems.length,
        state => state.pageSize
    ],
    (itemCount, pageSize) => {
        if (!pageSize) return 0;
        if (!itemCount) return 1;
        return Math.ceil(itemCount / pageSize);
    }
)

export const makeGetPaginatedItems = () => createSelector(
    [
        state => state.tableItems,
        state => state.pageSize,
        state => state.currentPage
    ],
    (items, pageSize, pageIndex) => {
        if (!pageSize) return items;

        const start = pageIndex * pageSize;
        const end = (pageIndex + 1) * pageSize;
        return items.slice(start, end);
    }
)
