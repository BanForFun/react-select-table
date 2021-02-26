import {createSelector} from "reselect";

export const makeGetSelectionArg = options => createSelector(
    s => s.selection,
    selection => options.multiSelect
        ? selection
        : selection.values().next().value ?? null
)
