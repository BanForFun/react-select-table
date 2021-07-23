import {isPageFirst, isPageLast} from "./paginationSelectors";

export const makeGetSelectionArg = (options) => state =>
    options.multiSelect
        ? state.selection
        : state.selection.values().next().value ?? null;

export const getActiveRowIndex = state =>
    state.pageSize ? state.activeIndex % state.pageSize : state.activeIndex;

export const getActiveValue = state =>
    state.rowValues[getActiveRowIndex(state)];

export const isActiveItemLast = state =>
    isPageLast(state) && getActiveRowIndex(state) === state.rowValues.length - 1;

export const isActiveItemFirst = state =>
    isPageFirst(state) && getActiveRowIndex(state) === 0;
