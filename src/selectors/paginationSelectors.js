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
        state => state.currentPage
    ],
    (items, size, index) => {
        if (!size) return items;

        const start = (index - 1) * size;
        const end = index * size;
        return items.slice(start, end);
    }
)