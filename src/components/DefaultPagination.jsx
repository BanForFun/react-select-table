import React, {useCallback, useRef} from 'react';
import classNames from 'classnames';
import AngleUpIcon from "./AngleUpIcon";
import _ from "lodash";
import {unFocusable} from "../utils/eventUtils";
import useEvent from "../hooks/useEvent";

const startDelay = 600
const repeatDelay = 100

//Child of PaginationContainer
function DefaultPagination({
    page,
    activePage,
    pageCount,
    nextPage,
    prevPage,
    firstPage,
    lastPage
}) {
    const Page = ({ number, action, children }) => {
        if (!number)
            return <span className="rst-page">{children}</span>

        const className = classNames({
            "rst-page": true,
            "rst-current": number === page,
            "rst-active": number === activePage
        });

        return <button
            {...unFocusable}
            className={className}
            onClick={action}
        >{number}</button>
    };

    const repeatTimeoutRef = useRef(null);

    const repeatAction = useCallback(action => {
        const repeatAction = (delay = repeatDelay) => {
            action();
            repeatTimeoutRef.current = setTimeout(repeatAction, delay);
        }

        return () => repeatAction(startDelay);
    }, [repeatTimeoutRef]);

    useEvent(window, "mouseup", useCallback(() => {
        clearTimeout(repeatTimeoutRef.current);
    }, [repeatTimeoutRef]));

    const pages = [];
    const pageFromEnd = pageCount - page + 1;

    if (page >= 4)
        pages.push(<Page key="ellipsis_left">...</Page>);

    if (page >= 3)
        pages.push(<Page key="page_prev" number={page - 1} action={prevPage} />)

    if (page >= 2 && pageFromEnd >= 2)
        pages.push(<Page key="page_current" number={page} />)

    if (pageFromEnd >= 3)
        pages.push(<Page key="page_next" number={page + 1} action={nextPage} />)

    if (pageFromEnd >= 4)
        pages.push(<Page key="ellipsis_right">...</Page>);

    const paddingLeft = 4 - page;
    const paddingRight = 4 - pageFromEnd;

    return <div className="rst-pagination">
        <button
            disabled={page === 1}
            className="rst-prev"
            onMouseDown={repeatAction(prevPage)}
        >
            <AngleUpIcon  />
        </button>

        {_.times(paddingLeft, i => <Page key={`padding_left_${i}`} />)}

        <Page number={1} action={firstPage} />
        {pages}
        <Page number={pageCount} action={lastPage} />

        {_.times(paddingRight, i => <Page key={`padding_right_${i}`} />)}

        <button
            disabled={page === pageCount}
            className="rst-next"
            onMouseDown={repeatAction(nextPage)}
        >
            <AngleUpIcon />
        </button>
    </div>
}

export default DefaultPagination;
