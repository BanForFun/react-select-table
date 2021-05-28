export const getPageCount = s => {
    const { pageSize, visibleItemCount } = s;
    if (!pageSize) return null;
    if (!visibleItemCount) return 1;

    return Math.ceil(visibleItemCount / pageSize);
}

export const getActivePageIndex = s =>
    s.pageSize && Math.trunc(s.activeIndex / s.pageSize);

export const getFirstVisibleIndex = s =>
    s.pageSize * s.pageIndex
