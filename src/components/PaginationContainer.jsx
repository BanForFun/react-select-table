import React, {useMemo} from 'react';
import {relativePos} from "../store/table";
import {getPageCount} from "../selectors/paginationSelectors";

//Child of Root
function PaginationContainer({
    Pagination,
    actions,
    showPlaceholder,
    table: { utils }
}) {
    const pageIndex = utils.useSelector(s => s.pageIndex);
    const pageSize = utils.useSelector(s => s.pageSize);
    const pageCount = utils.useSelector(getPageCount);

    const actionAliases = useMemo(() => {
        const createAlias = pos => () => actions.goToPageRelative(pos);

        return {
            nextPage: createAlias(relativePos.NEXT),
            prevPage: createAlias(relativePos.PREV),
            firstPage: createAlias(relativePos.FIRST),
            lastPage: createAlias(relativePos.LAST),
        }
    }, [actions]);

    if (showPlaceholder || !pageSize) return null;

    const paginationProps = {
        page: pageIndex + 1,
        pageCount
    };

    return <div className="rst-paginationContainer">
        <Pagination {...paginationProps} {...actionAliases} />
    </div>
}

export default React.memo(PaginationContainer);
