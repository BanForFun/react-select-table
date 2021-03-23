import React, {useCallback} from 'react';

//Child of Root
function PaginationContainer({
    Pagination,
    actions,
    showPlaceholder,
    storage: { utils, selectors }
}) {
    const page = utils.useSelector(s => s.pageIndex + 1);
    const activePage = utils.useSelector(s => selectors.getItemPage(s, s.activeIndex) + 1);
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
