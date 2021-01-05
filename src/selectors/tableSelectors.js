import { createSelector } from "reselect";

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
            rows: items.slice(start, end)
        };
    }
);

export const makeGetPageCount = () => createSelector(
    slice => slice.pageSize,
    slice => slice.tableItems.length,

    (pageSize, itemCount) => {
        if (pageSize <= 0) return 0;
        if (!itemCount) return 1;

        return Math.ceil(itemCount / pageSize);
    }
);

export const makeGetSelectionArg = options => createSelector(
    slice => slice.selection,
    selection => options.multiSelect
        ? selection
        : selection.values().next().value ?? null
)

