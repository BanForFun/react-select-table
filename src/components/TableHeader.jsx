import React, {Fragment, useCallback} from 'react';
import AngleUpIcon from "./AngleUpIcon";
import _ from "lodash";
import classNames from "classnames";

//Child of TableHead
function TableHeader({
    path,
    title,
    index,
    columnResizeStart,
    actions,
    sortAscending,
    sortPriority,
    showPriority
}) {
    const handleTitleMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        if (path) actions.sortItems(e, path);
    }, [path, actions]);

    const handleResizeStart = useCallback((e) => {
        const isMouse = e.type === "mousedown";
        if (isMouse && e.button !== 0) return;

        e.stopPropagation();

        const header = e.currentTarget.offsetParent;
        const row = header.parentElement;
        const widths = _.map(row.children, th => th.offsetWidth);
        const {clientX} = isMouse ? e : e.touches[0];

        columnResizeStart(index, clientX, header.offsetLeft, widths);
    }, [columnResizeStart, index]);

    const thClass = classNames({
        "is-descending": sortAscending === false
    });

    const spanClass = classNames({
        "is-sortable": path
    });

    return <th className={thClass} scope="col">
        <span
            className={spanClass}
            onMouseDown={handleTitleMouseDown}
        >{title}</span>

        {sortPriority >= 0 && <Fragment>
            <AngleUpIcon className="rst-sortIcon" />
            {showPriority && <small>{sortPriority}</small>}
        </Fragment>}

        <div
            className="rst-columnResizer"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
        />
    </th>;
}

export default React.memo(TableHeader);
