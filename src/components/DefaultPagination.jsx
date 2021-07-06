import React, {useCallback, useRef} from 'react';
import AngleIcon, {angleRotation} from "./AngleIcon";
import _ from "lodash";
import useEvent from "../hooks/useEvent";
import {unFocusable} from "../utils/elementUtils";
import classNames from "classnames";

const startDelay = 600
const repeatDelay = 100

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

    function Page({ number, action, children, ...rest }) {
        if (!number)
            return <span className="rst-page">{children}</span>

        const buttonClass = classNames({
            "rst-page": true,
            "is-current": number === page
        });

        return <button
            {...unFocusable}
            {...rest}
            className={buttonClass}
            onMouseDown={action}
        >{number}</button>
    }

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
        <Page
            disabled={page === 1}
            action={repeatAction(prevPage)}
            number={<AngleIcon rotation={angleRotation.Left} />}
        />

        {_.times(paddingLeft, i => <Page key={`padding_left_${i}`} />)}

        <Page number={1} action={firstPage} />
        {pages}
        <Page number={pageCount} action={lastPage} />

        {_.times(paddingRight, i => <Page key={`padding_right_${i}`} />)}

        <Page
            disabled={page === pageCount}
            action={repeatAction(nextPage)}
            number={<AngleIcon rotation={angleRotation.Right} />}
        />
    </div>
}

export default DefaultPagination;
