import {createSelector} from "reselect";

export const makeGetPaginatedItems = (getSorted) => createSelector(
    getSorted,
    getFirstVisibleIndex,
    s => s.pageSize,
    (sorted, start, size) =>
        size ? sorted.slice(start, start + size) : sorted
)

export const makeGetPageCount = (getItemCount) => s => {
    const { pageSize } = s;
    if (!pageSize) return null;

    const itemCount = getItemCount(s);
    if (!itemCount) return 1;

    return Math.ceil(itemCount / pageSize);
}

export const getActivePageIndex = (s) =>
    s.pageSize && Math.trunc(s.activeIndex / s.pageSize);

export const getFirstVisibleIndex = s =>
    s.pageSize * s.pageIndex
