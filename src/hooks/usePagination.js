import {useMemo} from "react";
import useTableStoreHooks from "./useTableStoreHooks";
import {makeGetPageCount} from "../selectors/paginationSelectors";

export default function usePagination(ns) {
    const {useSelector, dispatchers} = useTableStoreHooks(ns);

    const getPageCount = useMemo(makeGetPageCount, []);
    const pageCount = useSelector(getPageCount);
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
