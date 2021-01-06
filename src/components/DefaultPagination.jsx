import React from 'react';
import _ from "lodash";
import AngleDownIcon from "./AngleDownIcon";
import {unFocusable} from "../utils/eventUtils";

function DefaultPagination({ page: currentPage, pageCount, goToPage }) {
    const PaginationButton = ({ page, children, ...rest }) => (
        <button
            onClick={e => goToPage(page, e.ctrlKey)}
            className={currentPage === page ? "rst-active" : null}
            {...unFocusable}
            {...rest}
        >{children ?? page}</button>
    );

    const getPages = () => {
        const neighbours = 1;
        const totalNumbers = neighbours * 2 + 3;
        const blockCount = totalNumbers + 2;

        if (pageCount <= blockCount)
            return _.range(1, pageCount);

        const startPage = Math.max(currentPage - neighbours, 2);
        const endPage = Math.min(currentPage + neighbours + 1, pageCount);
        const pages = _.range(startPage, endPage);

        const hasLeftAbbr = startPage > 2;
        const hasRightAbbr = pageCount - endPage > 0;
        const abbrCount = totalNumbers - 1 - pages.length;

        const getPages = (...middle) => [1, ...middle, pageCount];

        if (hasLeftAbbr && !hasRightAbbr) {
            const extra = _.range(startPage - abbrCount, startPage);
            return getPages(null, ...extra, ...pages);
        }

        if (!hasLeftAbbr && hasRightAbbr) {
            const extra = _.range(endPage, endPage + abbrCount);
            return getPages(...pages, ...extra, null);
        }

        return getPages(null, ...pages, null);
    }

    return <div className="rst-pagination">
        <PaginationButton
            page={currentPage - 1}
            disabled={currentPage === 1}
        >
            <AngleDownIcon className="rst-prevPage" />
        </PaginationButton>

        {getPages().map((page, index) =>
            page === null
                ? <div key={`ellipsis-${index}`}>...</div>
                : <PaginationButton key={`page-${page}`} page={page}/>
        )}

        <PaginationButton
            page={currentPage + 1}
            disabled={currentPage === pageCount}
        >
            <AngleDownIcon className="rst-nextPage" />
        </PaginationButton>
    </div>
}

export default DefaultPagination;
