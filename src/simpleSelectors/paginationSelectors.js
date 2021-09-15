export const getPageSize = state =>
    state.pageSize || state.visibleItemCount;

export const getPageCount = state =>
    Math.ceil(state.visibleItemCount / getPageSize(state));

export const getItemPageIndex = (state, itemIndex) =>
    Math.floor(itemIndex / getPageSize(state));

export const getPageIndex = state =>
    getItemPageIndex(state, state.activeIndex);

export const getPageIndexOffset = state =>
    getPageIndex(state) * state.pageSize;

