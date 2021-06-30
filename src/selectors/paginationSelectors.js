export function getPageCount(state) {
    const { pageSize, visibleItemCount } = state;
    if (!pageSize || !visibleItemCount) return 1;

    return Math.ceil(visibleItemCount / pageSize);
}
