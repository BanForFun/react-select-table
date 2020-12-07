import useTableStoreHooks from "./useTableStoreHooks";

export default function usePagination(ns) {
    const {useSelector, dispatchers, utils} = useTableStoreHooks(ns);

    const pageCount = useSelector(utils.getPageCount);
    const pageIndex = useSelector(s => s.currentPage);

    return {
        pageCount,
        pageIndex,
        isFirst: pageIndex === 0,
        isLast: pageIndex === pageCount - 1,
        nextPage: dispatchers.nextPage,
        previousPage: dispatchers.previousPage,
        goToPage: dispatchers.goToPage,
        firstPage: dispatchers.firstPage,
        lastPage: dispatchers.lastPage
    }
}
