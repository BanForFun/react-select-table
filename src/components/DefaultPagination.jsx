import React from 'react';
import _ from "lodash";
import AngleDownIcon from "./AngleDownIcon";
import {unFocusable} from "../utils/eventUtils";

const neighbourNumbers = 1;

//Neighbour numbers + Ellipsis / number (for one side)
const neighbourBlocks = neighbourNumbers + 1;

//Neighbour numbers + Ellipsis / number + Edge number (for both sides)
const totalBlocks = (neighbourBlocks + 1) * 2;

//Child of PaginationContainer
function DefaultPagination({ page: currentPage, pageCount, goToPage }) {
    const PaginationButton = ({ page, children, ...rest }) => (
        <button
            onClick={() => goToPage(page)}
            className={currentPage === page ? "rst-active" : null}
            {...unFocusable}
            {...rest}
        >{children ?? page}</button>
    );

    const getPages = () => {
        if (pageCount <= totalBlocks)
            return _.range(1, pageCount);

        const start = currentPage - neighbourBlocks
        const end = currentPage + neighbourBlocks

        const startMargin = start - 1;
        const endMargin = pageCount - end;
        const offset = Math.min(endMargin, 1) - Math.min(startMargin, 1);

        const pages = _.range(start + offset, end + offset + 1);

        if (startMargin >= 2)
            pages[0] = null;

        if (endMargin >= 2)
            pages[pages.length - 1] = null;

        pages.unshift(1);
        pages.push(pageCount);

        return pages;
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
