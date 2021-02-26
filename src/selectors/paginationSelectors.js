import _ from "lodash";
import {createSelector} from "reselect";

const makeGetVisibleRange = () => createSelector(
    s => s.pageSize,
    s => s.page,

    (pageSize, page) => pageSize ? {
        from: (page - 1) * pageSize,
        to: page * pageSize
    } : null
)

export const makeGetPaginatedItems = () => createSelector(
    s => s.tableItems,
    makeGetVisibleRange(),

    (items, range) => ({
        startIndex: range?.from ?? 0,
        rows: range ? items.slice(range.from, range.to) : items
    })
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

export const makeGetIsActiveRowVisible = () => createSelector(
    s => s.activeIndex,
    makeGetVisibleRange(),

    (active, range) =>
        !range || _.inRange(active, range.from, range.to)
)

