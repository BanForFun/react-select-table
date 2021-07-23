import React, {useMemo} from 'react';
import {relativePos} from "../models/Actions";

//Child of Root
function PaginationWrapper({
    Pagination,
    actions,
    utils: { hooks, selectors }
}) {
    const pageIndex = hooks.useSelector(selectors.getPageIndex);
    const pageCount = hooks.useSelector(selectors.getPageCount);

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
