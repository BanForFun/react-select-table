import React, {useCallback} from 'react';
import AngleDownIcon from "./AngleDownIcon";

function TableHeader({
    path,
    title,
    index,
    columnResizeStart,
    actions,
    addSeparator,
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

    return <th data-path={path} onMouseDown={handleMouseDown}>
        {title}
        <AngleDownIcon className="rst-sortIcon" data-order={sortOrder} />
        {addSeparator && <div
            className="rst-separator"
            onMouseDown={handleSeparatorMouseDown}
            onTouchStart={handleResizeStart}
        />}
    </th>;
}

export default React.memo(TableHeader);
