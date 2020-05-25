import { createSelector } from "reselect";

export const makeGetPageCount = () => createSelector(
    [
        state => state.tableItems.length,
        state => state.pageSize
    ],
    (itemCount, pageSize) =>
        Math.ceil(itemCount / pageSize)
)