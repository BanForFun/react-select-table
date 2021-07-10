import React, {useCallback, useRef} from 'react';
import AngleIcon, {angleRotation} from "./AngleIcon";
import _ from "lodash";
import useEvent from "../hooks/useEvent";
import classNames from "classnames";

const startDelay = 600
const repeatDelay = 100

function PageSpacer({children}) {
    return <span className="rst-page">{children}</span>
}

//Child of PaginationContainer
function DefaultPagination({
    page,
    pageCount,
    nextPage,
    prevPage,
    firstPage,
    lastPage
}) {
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

    function Page({ number, ...rest }) {
        const buttonClass = classNames({
            "rst-page": true,
            "is-current": number === page
        });

        return <button
            {...rest}
            tabIndex="-1"
            className={buttonClass}
        >{number}</button>
    }

    const pages = [];
    const pageFromEnd = pageCount - page + 1;

    if (page >= 4)
        pages.push(<PageSpacer key="ellipsis_left">...</PageSpacer>);

    if (page >= 3)
        pages.push(<Page key="page_prev" number={page - 1} onClick={prevPage} />)

    if (page >= 2 && pageFromEnd >= 2)
        pages.push(<Page key="page_current" number={page} />)

    if (pageFromEnd >= 3)
        pages.push(<Page key="page_next" number={page + 1} onClick={nextPage} />)

    if (pageFromEnd >= 4)
        pages.push(<PageSpacer key="ellipsis_right">...</PageSpacer>);

    const paddingLeft = 4 - page;
    const paddingRight = 4 - pageFromEnd;

    return <div className="rst-pagination">
        <button
            tabIndex="-1"
            disabled={page === 1}
            onMouseDown={repeatAction(prevPage)}
        >
            <AngleIcon rotation={angleRotation.Left} />
        </button>

        {_.times(paddingLeft, i => <PageSpacer key={`padding_left_${i}`} />)}

        {pageCount > 0 && <Page number={1} onClick={firstPage} />}
        {pages}
        {pageCount > 1 && <Page number={pageCount} onClick={lastPage} />}

        {_.times(paddingRight, i => <PageSpacer key={`padding_right_${i}`} />)}

        <button
            tabIndex="-1"
            disabled={page === pageCount}
            onMouseDown={repeatAction(nextPage)}
        >
            <AngleIcon rotation={angleRotation.Right} />
        </button>
    </div>
}

export default DefaultPagination;
