import styles from "../index.scss";

import React, {useCallback} from 'react';
import classNames from "classnames";
import _ from "lodash";
import TableCell from "./TableCell";

function TableRow({
    columns,
    name,
    dispatchers,
    touchingIndex,
    selected,
    active,
    item,
    value,
    index
}) {

    const handleContextMenu = useCallback(e => {
        if (index === touchingIndex.current)
            dispatchers.select(index, true);
        else
            dispatchers.contextMenu(index, e.ctrlKey);
    }, [index, dispatchers, touchingIndex]);

    const handleMouseDown = useCallback(e => {
        dispatchers.select(index, e.ctrlKey, e.shiftKey);
    }, [index, dispatchers]);

    const handleTouchStart = useCallback(() => {
        touchingIndex.current = index;
    }, [index, touchingIndex]);

    const renderColumn = column => {
        const { _id, path, render, className, isHeader } = column;
        const content = _.get(item, path);

        const props = {
            content,
            key: `cell_${name}_${value}_${_id}`,
            className, isHeader, render
        }

        return <TableCell {...props} />
    };

    const classes = {
        [styles.selected]: selected,
        [styles.active]: active
    };

    return <tr
        className={classNames(classes, item._className)}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
    >
        {columns.map(renderColumn)}
    </tr>;
}

export default React.memo(TableRow);
