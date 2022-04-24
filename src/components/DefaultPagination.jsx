import React, {useCallback, useEffect, useRef} from 'react';
import AngleIcon, {angleRotation} from "./AngleIcon";
import _ from "lodash";
import classNames from "classnames";

const startDelay = 600
const repeatDelay = 100

function PageSpacer({children}) {
    return <div className="rst-page">{children}</div>
}

//Child of PaginationContainer
function DefaultPagination({ page, pageCount, goToPage }) {
    const repeatOffsetPage = useCallback(offset => {
        let timeoutId, nextPage = page;
        const repeatAction = (delay = repeatDelay) => {
            if (!goToPage(nextPage += offset)) return;
            timeoutId = setTimeout(repeatAction, delay);
        }

        return e => {
            repeatAction(startDelay);
            e.currentTarget.setPointerCapture(e.pointerId);
            e.currentTarget.addEventListener("pointerup", e => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                clearTimeout(timeoutId);
            }, { once: true });
        }
    }, [page, goToPage]);

    function Page({ number, ...rest }) {
        const buttonClass = classNames({
            "rst-page": true,
            "is-current": number === page
        });

        return <button
            {...rest}
            tabIndex="-1"
            className={buttonClass}
            onClick={() => goToPage(number)}
        >{number}</button>
    }

    const pages = [];
    const pageFromEnd = pageCount - page + 1;

    if (page >= 4)
        pages.push(<PageSpacer key="ellipsis_left">...</PageSpacer>);

    if (page >= 3)
        pages.push(<Page key="page_prev" number={page - 1} />)

    if (page >= 2 && pageFromEnd >= 2)
        pages.push(<Page key="page_current" number={page} />)

    if (pageFromEnd >= 3)
        pages.push(<Page key="page_next" number={page + 1} />)

    if (pageFromEnd >= 4)
        pages.push(<PageSpacer key="ellipsis_right">...</PageSpacer>);

    const paddingLeft = 4 - page;
    const paddingRight = 4 - pageFromEnd;

    return <div className="rst-pagination">
        <button
            tabIndex="-1"
            disabled={page === 1}
            onPointerDown={repeatOffsetPage(-1)}
        >
            <AngleIcon rotation={angleRotation.Left} />
        </button>

        {_.times(paddingLeft, i => <PageSpacer key={`padding_left_${i}`} />)}

        {pageCount > 0 && <Page number={1} />}
        {pages}
        {pageCount > 1 && <Page number={pageCount} />}

        {_.times(paddingRight, i => <PageSpacer key={`padding_right_${i}`} />)}

        <button
            tabIndex="-1"
            disabled={page === pageCount}
            onPointerDown={repeatOffsetPage(1)}
        >
            <AngleIcon rotation={angleRotation.Right} />
        </button>
    </div>
}

export default DefaultPagination;
