import React, {Fragment, useCallback} from 'react';
import AngleUpIcon from "./AngleUpIcon";

//Child of TableHead
function TableHeader({
    path,
    title,
    index,
    columnResizeStart,
    actions,
    addResizer,
    sortAscending,
    sortPriority
}) {
    const handleMouseDown = useCallback(e => {
        if (e.button !== 0 || !path) return;
        actions.sortItems(path, e.shiftKey);
    }, [path, actions]);

    const handleResizeStart = useCallback(e => {
        e.stopPropagation();

        const bounds = e.currentTarget.getBoundingClientRect();
        columnResizeStart(index, e.clientX, bounds.left, bounds.right);
    }, [columnResizeStart, index]);

    const handleSeparatorMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        handleResizeStart(e);
    }, [handleResizeStart]);

    return <th
        data-path={path}
        data-ascending={sortAscending}
        onMouseDown={handleMouseDown}
        scope="col"
    >
        {title}

        {sortPriority >= 0 && <>
            <AngleUpIcon className="rst-sortIcon" />
            <small>{sortPriority}</small>
        </>}

        {addResizer && <div
            className="rst-columnResizer"
            onMouseDown={handleSeparatorMouseDown}
            onTouchStart={handleResizeStart}
        />}
    </th>;
}

export default React.memo(TableHeader);
