import React, {Fragment, useCallback} from 'react';
import AngleUpIcon from "./AngleUpIcon";
import _ from "lodash";

//Child of TableHead
function TableHeader({
    path,
    title,
    index,
    columnResizeStart,
    actions,
    sortAscending,
    sortPriority
}) {
    const handleMouseDown = useCallback(e => {
        if (!e.button && path)
            actions.sortItems(path, e);
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

    return <th
        data-ascending={sortAscending}
        onMouseDown={handleMouseDown}
        scope="col"
    >
        {title}

        {sortPriority >= 0 && <Fragment>
            <AngleUpIcon className="rst-sortIcon" />
            <small>{sortPriority}</small>
        </Fragment>}

        <div
            className="rst-columnResizer"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
        />
    </th>;
}

export default React.memo(TableHeader);
