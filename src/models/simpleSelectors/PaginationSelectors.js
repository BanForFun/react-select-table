export default class PaginationSelectors {
    getPageSize = (state) =>
        state.pageSize || state.visibleItemCount;

    getPageCount = (state) =>
        Math.ceil(state.visibleItemCount / this.getPageSize(state));

    getItemPageIndex = (state, itemIndex) =>
        Math.floor(itemIndex / this.getPageSize(state));

    getPageIndex = (state) =>
        this.getItemPageIndex(state, state.activeIndex);

    getPageIndexOffset = (state) =>
        this.getPageIndex(state) * state.pageSize;
}
