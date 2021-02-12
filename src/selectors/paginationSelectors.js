import _ from "lodash";
import {createSelector} from "reselect";

function getVisibleRange(pageSize, page) {
    if (!pageSize) return null;

    return {
        start: (page - 1) * pageSize,
        end: page * pageSize
    }
}

export const makeGetPaginatedItems = () => createSelector(
    slice => slice.tableItems,
    slice => slice.pageSize,
    slice => slice.page,

    (items, pageSize, page) => {
        const range = getVisibleRange(pageSize, page);

        return {
            startIndex: range?.start ?? 0,
            rows: range ? items.slice(range.start, range.end) : items
        }
    }
)

export const makeGetPageCount = () => createSelector(
    slice => slice.pageSize,
    slice => slice.tableItems.length,

    (pageSize, itemCount) => {
        if (!pageSize) return null;
        if (!itemCount) return 1;

        return Math.ceil(itemCount / pageSize);
    }
)

export const makeIsActiveRowVisible = () => createSelector(
    slice => slice.activeIndex,
    slice => slice.pageSize,
    slice => slice.page,

    (active, pageSize, page) => {
        const range = getVisibleRange(pageSize, page);
        return !range || _.inRange(active, range.start, range.end);
    }
)

