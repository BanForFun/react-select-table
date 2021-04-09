import React, {useCallback} from 'react';
import AngleDownIcon from "./AngleDownIcon";

//Child of TableHead
function TableHeader({
    path,
    title,
    index,
    columnResizeStart,
    actions,
    addResizer,
    sortOrder
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
        data-order={sortOrder}
        onMouseDown={handleMouseDown}
        scope="col"
    >
        {title}
        <AngleDownIcon className="rst-sortIcon" />
        {addResizer && <div
            className="rst-columnResizer"
            onMouseDown={handleSeparatorMouseDown}
            onTouchStart={handleResizeStart}
        />}
    </th>;
}

export default React.memo(TableHeader);
