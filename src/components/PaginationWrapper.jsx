import React, {useMemo} from 'react';
import {relativePos} from "../store/table";

//Child of Root
function PaginationWrapper({
    Pagination,
    actions,
    table: { utils, selectors }
}) {
    const pageIndex = utils.useSelector(s => s.pageIndex);
    const pageCount = utils.useSelector(selectors.getPageCount);

    const actionAliases = useMemo(() => {
        const createAlias = pos => () => actions.goToPageRelative(pos);

        return {
            nextPage: createAlias(relativePos.Next),
            prevPage: createAlias(relativePos.Prev),
            firstPage: createAlias(relativePos.First),
            lastPage: createAlias(relativePos.Last),
        }
    }, [actions]);

    const paginationProps = {
        page: pageIndex + 1,
        pageCount
    };

    return <Pagination {...paginationProps} {...actionAliases} />;
}

export default React.memo(PaginationWrapper);
