export function getPageCount(state) {
    const { pageSize, visibleItemCount } = state;
    if (!pageSize || !visibleItemCount) return 1;

    return Math.ceil(visibleItemCount / pageSize);
}

export const isPageLast = state =>
    state.pageIndex === getPageCount(state) - 1;

export const isPageFirst = state => 
    state.pageIndex === 0;

export const isActiveItemLast = state =>
    isPageLast(state) && state.activeIndex === state.rowValues.length - 1;

export const isActiveItemFirst = state =>
    isPageFirst(state) && state.activeIndex === 0;
