import React from 'react';
import {getActivePageIndex} from "../selectors/paginationSelectors";

//Child of Root
function PaginationContainer({
    Pagination,
    actions,
    showPlaceholder,
    table: { utils, selectors }
}) {
    const pageIndex = utils.useSelector(s => s.pageIndex);
    const activePageIndex = utils.useSelector(getActivePageIndex);
    const pageCount = utils.useSelector(selectors.getPageCount);

    if (showPlaceholder || !pageCount) return null;

    const paginationProps = {
        page: pageIndex + 1,
        activePage: activePageIndex + 1,
        pageCount,
        nextPage: actions.nextPage,
        prevPage: actions.prevPage,
        firstPage: actions.firstPage,
        lastPage: actions.lastPage
    };

    return <div className="rst-paginationContainer">
        <Pagination {...paginationProps} />
    </div>
}

export default React.memo(PaginationContainer);
