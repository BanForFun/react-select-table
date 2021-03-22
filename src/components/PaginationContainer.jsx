import React, {useCallback} from 'react';

//Child of Root
function PaginationContainer({
    Pagination,
    actions,
    showPlaceholder,
    storage: { utils, selectors }
}) {
    const page = utils.useSelector(s => s.pageIndex + 1);
    const pageCount = utils.useSelector(selectors.getPageCount);

    const goToPage = useCallback(page =>
        actions.goToPage(page - 1), [actions]);

    if (showPlaceholder || !pageCount) return null;

    return <div className="rst-paginationContainer">
        <Pagination
            page={page}
            pageCount={pageCount}
            goToPage={goToPage}
        />
    </div>
}

export default React.memo(PaginationContainer);
