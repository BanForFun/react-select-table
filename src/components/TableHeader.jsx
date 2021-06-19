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

    const handleResizeStart = useCallback(e => {
        e.stopPropagation();

        const header = e.currentTarget.offsetParent;
        const row = header.parentElement;
        const widths = _.map(row.children, th => th.offsetWidth);

        columnResizeStart(index, e.clientX, header.offsetLeft, widths);
    }, [columnResizeStart, index]);

    const handleSeparatorMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        handleResizeStart(e);
    }, [handleResizeStart]);

    return <th
        data-ascending={sortAscending}
        onMouseDown={handleMouseDown}
        scope="col"
    >
        {title}

        {sortPriority >= 0 && <>
            <AngleUpIcon className="rst-sortIcon" />
            <small>{sortPriority}</small>
        </>}

        <div
            className="rst-columnResizer"
            onMouseDown={handleSeparatorMouseDown}
            onTouchStart={handleResizeStart}
        />
    </th>;
}

export default React.memo(TableHeader);
