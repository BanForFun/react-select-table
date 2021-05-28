import React, {useMemo} from 'react';
import {relativePos} from "../store/table";

//Child of Root
function PaginationContainer({
    Pagination,
    actions,
    showPlaceholder,
    table: { utils, selectors }
}) {
    const pageIndex = utils.useSelector(s => s.pageIndex);
    const pageCount = utils.useSelector(selectors.getPageCount);

    if (showPlaceholder || !pageCount) return null;

    const actionAliases = useMemo(() => {
        const createAlias = pos => () => actions.goToPageRelative(pos);

        return {
            nextPage: createAlias(relativePos.NEXT),
            prevPage: createAlias(relativePos.PREV),
            firstPage: createAlias(relativePos.FIRST),
            lastPage: createAlias(relativePos.LAST),
        }
    }, [actions]);

    const paginationProps = {
        page: pageIndex + 1,
        pageCount
    };

    return <div className="rst-paginationContainer">
        <Pagination {...paginationProps} {...actionAliases} />
    </div>
}

export default React.memo(PaginationContainer);
