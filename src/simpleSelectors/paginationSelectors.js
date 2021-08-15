export const getPageCount = state =>
    Math.ceil(state.visibleItemCount / state.pageSize) || 1;

export const getItemPageIndex = (state, itemIndex) =>
    Math.floor(itemIndex / state.pageSize) || 0;

export const getPageIndex = state =>
    getItemPageIndex(state, state.activeIndex);

export const getPageSize = state =>
    state.pageSize || state.visibleItemCount;

export const getPageIndexOffset = state =>
    getPageIndex(state) * state.pageSize;

