import styles from "../index.scss";

import React, {useCallback} from 'react';
import AngleDownIcon from "./AngleDownIcon";

function TableHeader({
    path,
    title,
    index,
    columnResizeStart,
    dispatchers,
    addSeparator,
    sortOrder
}) {
    const handleMouseDown = useCallback(e => {
        if (!path) return;
        dispatchers.sortItems(path, e.shiftKey);
    }, [path, dispatchers]);

    const handleResizeStart = useCallback(e => {
        e.stopPropagation();

        const bounds = e.currentTarget.getBoundingClientRect();
        columnResizeStart(index, e.clientX, bounds.left, bounds.right);
    }, [columnResizeStart, index]);

    return <th data-path={path} onMouseDown={handleMouseDown}>
        {title}
        <AngleDownIcon className={styles.sortIcon} data-order={sortOrder} />
        {addSeparator && <div
            className={styles.separator}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
        />}
    </th>;
}

export default React.memo(TableHeader);
