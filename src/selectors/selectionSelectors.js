import {createSelector} from "reselect";

export const makeGetSelectionArg = options => createSelector(
    slice => slice.selection,
    selection => options.multiSelect
        ? selection
        : selection.values().next().value ?? null
)
