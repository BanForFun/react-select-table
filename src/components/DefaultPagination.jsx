import React from 'react';
import _ from "lodash";
import AngleDownIcon from "./AngleDownIcon";

function DefaultPagination({ pageCount: totalPages, page: currentPage, goToPage }) {
    const PaginationButton = ({ page, children, ...rest }) => {
        return <button
            onClick={() => goToPage(page)}
            className={currentPage === page ? "rst-active" : null}
            {...rest}
        >{children ?? page}</button>
    }

    function getPages() {
        const neighbours = 1;
        const totalNumbers = neighbours * 2 + 3;
        const blockCount = totalNumbers + 2;

        if (totalPages <= blockCount)
            return _.range(1, totalPages);

        const startPage = Math.max(currentPage - neighbours, 2);
        const endPage = Math.min(currentPage + neighbours + 1, totalPages);
        let pages = _.range(startPage, endPage);

        const hasLeftAbbr = startPage > 2;
        const hasRightAbbr = totalPages - endPage > 0;
        const abbrCount = totalNumbers - 1 - pages.length;

        if (hasLeftAbbr && !hasRightAbbr) {
            const extraPages = _.range(startPage - abbrCount, startPage);
            pages = [null, ...extraPages, ...pages];
        } else if (!hasLeftAbbr && hasRightAbbr) {
            const extraPages = _.range(endPage, endPage + abbrCount);
            pages = [...pages, ...extraPages, null];
        } else {
            pages = [null, ...pages, null];
        }

        return [1, ...pages, totalPages];
    }

    return <div className="rst-pagination">
        <PaginationButton page={currentPage - 1} disabled={currentPage === 1}>
            <AngleDownIcon className="rst-prevPage" />
        </PaginationButton>

        {getPages().map((page, index) =>
            page === null
                ? <div key={`ellipsis-${index}`}>...</div>
                : <PaginationButton key={`page-${page}`} page={page}/>
        )}

        <PaginationButton page={currentPage + 1} disabled={currentPage === totalPages}>
            <AngleDownIcon className="rst-nextPage" />
        </PaginationButton>
    </div>
}

export default DefaultPagination;
