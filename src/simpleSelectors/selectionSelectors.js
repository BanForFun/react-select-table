export const makeGetSelectionArg = (options) => state =>
    options.multiSelect
        ? state.selection
        : state.selection.values().next().value ?? null;

export const getActiveValue = state =>
    state.rowValues[state.activeIndex];
