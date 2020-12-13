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

