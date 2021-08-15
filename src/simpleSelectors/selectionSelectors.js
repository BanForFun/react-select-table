import {getPageSize} from "./paginationSelectors";

export const makeGetSelectionArg = (options) => state =>
    options.multiSelect
        ? state.selection
        : state.selection.values().next().value ?? null;

export const getActiveRowIndex = state =>
    state.activeIndex % getPageSize(state);

export const getActiveValue = state =>
    state.rowValues[getActiveRowIndex(state)];

