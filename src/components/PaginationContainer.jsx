import React, {useCallback} from 'react';
import {getActivePageIndex} from "../selectors/paginationSelectors";

//Child of Root
function PaginationContainer({
    Pagination,
    actions,
    showPlaceholder,
    table: { utils, selectors }
}) {
    const page = utils.useSelector(s => s.pageIndex) + 1;
    const activePage = utils.useSelector(getActivePageIndex) + 1;
    const pageCount = utils.useSelector(selectors.getPageCount);

    const goToPage = useCallback(page =>
        actions.goToPage(page - 1), [actions]);

    if (showPlaceholder || !pageCount) return null;

    const paginationProps = {
        page, activePage, pageCount,
        goToPage
    };

    return <div className="rst-paginationContainer">
        <Pagination {...paginationProps} />
    </div>
}

export default React.memo(PaginationContainer);
