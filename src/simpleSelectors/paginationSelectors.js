export const getPageCount = state =>
    Math.ceil(state.visibleItemCount / state.pageSize) || 1;

export const getPageIndex = state =>
    Math.floor(state.activeIndex / state.pageSize) || 0;

export const isPageLast = state =>
    getPageIndex(state) === getPageCount(state) - 1;

export const isPageFirst = state =>
    getPageIndex(state) === 0;

