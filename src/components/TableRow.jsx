import React, {useCallback} from 'react';
import classNames from "classnames";
import _ from "lodash";
import TableCell from "./TableCell";

function TableRow({
    columns,
    name,
    actions,
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
            actions.select(index, true);
            dragSelectStart([e.clientX, e.clientY], index);
        } else {
            actions.contextMenu(index, e.ctrlKey);
        }
    }, [index, actions, isTouching]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        e.stopPropagation();

        actions.select(index, e.ctrlKey, e.shiftKey);
        dragSelectStart([e.clientX, e.clientY], index);
    }, [index, actions]);

    const renderColumn = column => {
        const { _id, path, render, className, isHeader } = column;
        const content = _.get(item, path);

        const cellProps = {
            content,
            key: `cell_${name}_${value}_${_id}`,
            className, isHeader, render, item
        }

        return <TableCell {...cellProps} />
    };

    const classes = {
        "rst-selected": selected,
        "rst-active": active
    };

    return <tr
        className={classNames(item._className, classes)}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
    >
        {columns.map(renderColumn)}
    </tr>;
}

export default React.memo(TableRow);
