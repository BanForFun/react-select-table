import _ from "lodash";
import {createSelector} from "reselect";

export const makeGetVisibleRange = () => createSelector(
    s => s.pageSize,
    s => s.page,
    s => s.tableItems.length,

    (pageSize, page, itemCount) => {
        const range = pageSize ? {
            start: (page - 1) * pageSize,
            end: Math.min(page * pageSize, itemCount)
        } : {
            start: 0,
            end: itemCount
        }

        range.includes = index =>
            _.inRange(index, range.start, range.end);

        return range;
    }
)

export const makeGetPaginatedItems = getVisibleRange => createSelector(
    s => s.tableItems,
    getVisibleRange,

    (items, range) =>
        items.slice(range.start, range.end)
)

export const makeGetPageCount = () => createSelector(
    s => s.pageSize,
    s => s.tableItems.length,

    (pageSize, itemCount) => {
        if (!pageSize) return null;
        if (!itemCount) return 1;

        return Math.ceil(itemCount / pageSize);
    }
)
