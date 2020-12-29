import React from 'react';

function PaginationContainer({
    Pagination,
    dispatchers,
    options: {utils}
}) {
    const pageIndex = utils.useSelector(s => s.pageIndex);
    const pageCount = utils.useSelector(utils.getPageCount);

    if (!pageCount) return null;

    return <div className="rst-paginationContainer">
        <Pagination
            pageIndex={pageIndex}
            pageCount={pageCount}
            goToPage={dispatchers.goToPage}
        />
    </div>
}

export default React.memo(PaginationContainer);
