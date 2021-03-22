import _ from "lodash";
import {createSelector} from "reselect";

export const makeGetVisibleRange = () => createSelector(
    s => s.pageSize,
    s => s.pageIndex,
    s => s.tableItems.length,

    (pageSize, pageIndex, itemCount) => {
        const start = pageSize * pageIndex;
        const end = start + (pageSize || itemCount);

        return {
            start, end,
            includes: index => _.inRange(index, start, end)
        };
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

export const makeGetVirtualActiveIndex = getVisibleRange => createSelector(
    s => s.activeIndex,
    s => s.virtualActiveIndex,
    getVisibleRange,

    (active, virtualActive, range) =>
        range.includes(active) ? active : virtualActive
)
