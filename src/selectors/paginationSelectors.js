import { createSelector } from "reselect";

export const makeGetPageCount = () => createSelector(
    [
        state => state.tableItems.length,
        state => state.pageSize
    ],
    (itemCount, pageSize) =>
        Math.ceil(itemCount / pageSize)
)

export const makeGetPaginatedItems = () => createSelector(
    [
        state => state.tableItems,
        state => state.pageSize,
        state => state.currentPage - 1
    ],
    (items, size, index) => {
        if (size === 0) return items;

        const start = index * size;
        const end = (index + 1) * size;
        return items.slice(start, end);
    }
)