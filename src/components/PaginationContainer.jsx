import React from 'react';

function PaginationContainer({
    Pagination,
    dispatchers,
    options: {utils}
}) {
    const page = utils.useSelector(s => s.page);
    const pageCount = utils.useSelector(utils.getPageCount);

    if (!pageCount) return null;

    return <div className="rst-paginationContainer">
        <Pagination
            page={page}
            pageCount={pageCount}
            goToPage={dispatchers.goToPage}
        />
    </div>
}

export default React.memo(PaginationContainer);
