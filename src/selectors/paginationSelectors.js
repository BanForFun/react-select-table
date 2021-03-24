import _ from "lodash";
import {createSelector} from "reselect";

export const makeGetVisibleRange = (getItemCount) => createSelector(
    s => s.pageSize,
    s => s.pageIndex,
    getItemCount,
    (pageSize, pageIndex, itemCount) => {
        const start = pageSize * pageIndex;
        const end = start + (pageSize || itemCount);

        return {
            start, end,
            includes: index => _.inRange(index, start, end)
        };
    }
)

export const makeGetPaginatedItems = (getVisible, getSorted) => createSelector(
    getSorted,
    getVisible,
    (sorted, range) => sorted.slice(range.start, range.end)
)

export const makeGetPageCount = (getItemCount) => s => {
    const { pageSize } = s;
    if (!pageSize) return null;

    const itemCount = getItemCount(s);
    if (!itemCount) return 1;

    return Math.ceil(itemCount / pageSize);
}

export const getItemPageIndex = (s, itemIndex) =>
    s.pageSize && Math.trunc(itemIndex / s.pageSize);
