import React, {useMemo} from 'react';
import {relativePos} from "../store/table";

//Child of Root
function PaginationContainer({
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

    return <div className="rst-paginationContainer">
        <Pagination {...paginationProps} {...actionAliases} />
    </div>
}

export default React.memo(PaginationContainer);
