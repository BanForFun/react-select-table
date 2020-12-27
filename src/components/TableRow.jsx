import styles from "../index.scss";

import React, {useCallback} from 'react';
import classNames from "classnames";
import _ from "lodash";
import TableCell from "./TableCell";

function TableRow({
    columns,
    name,
    dispatchers,
    isTouching,
    dragSelectStart,
    selected,
    active,
    item,
    value,
    index
}) {

    const handleContextMenu = useCallback(e => {
        e.stopPropagation();
        if (isTouching.current) {
            //Touch
            dispatchers.select(index, true);
            dragSelectStart([e.clientX, e.clientY], index);
            return;
        }

        //Mouse
        dispatchers.contextMenu(index, e.ctrlKey);
    }, [index, dispatchers, isTouching]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        e.stopPropagation();

        dispatchers.select(index, e.ctrlKey, e.shiftKey);
        dragSelectStart([e.clientX, e.clientY], index);
    }, [index, dispatchers]);

    const renderColumn = column => {
        const { _id, path, render, className, isHeader } = column;
        const content = _.get(item, path);

        const cellProps = {
            content,
            key: `cell_${name}_${value}_${_id}`,
            className, isHeader, render
        }

        return <TableCell {...cellProps} />
    };

    const classes = {
        [styles.selected]: selected,
        [styles.active]: active
    };

    return <tr
        className={classNames(classes, item._className)}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
    >
        {columns.map(renderColumn)}
    </tr>;
}

export default React.memo(TableRow);
