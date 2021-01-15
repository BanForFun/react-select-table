import {createSelector} from "reselect";

export const makeGetPaginatedItems = () => createSelector(
    slice => slice.tableItems,
    slice => slice.pageSize,
    slice => slice.page,

    (items, pageSize, page) => {
        pageSize ||= items.length;

        const end = page * pageSize;
        const start = end - pageSize;

        return {
            startIndex: start,
            endIndex: end,
            rows: items.slice(start, end)
        };
    }
);

export const makeGetPageCount = () => createSelector(
    slice => slice.pageSize,
    slice => slice.tableItems.length,

    (pageSize, itemCount) => {
        if (!pageSize) return null;
        if (!itemCount) return 1;

        return Math.ceil(itemCount / pageSize);
    }
);

