import React, {useCallback} from 'react';
import _ from "lodash";
import classNames from "classnames";

export const ActiveClass = "is-active";
export const SelectedClass = "is-selected";

//Child of TableBody
function TableRow({
    columns,
    name,
    actions,
    isTouchingRef,
    dragSelectStart,
    selected,
    active,
    data,
    value,
    rowIndex,
    className,
    indexOffset
}) {
    const index = rowIndex + indexOffset;

    const startDrag = useCallback(e => {
        dragSelectStart([e.clientX, e.clientY], rowIndex);
    }, [rowIndex, dragSelectStart]);

    const handleContextMenu = useCallback(e => {
        if (isTouchingRef.current) {
            actions.baseSelect(index, true, false);
            startDrag(e);
        } else {
            actions.select(e, index);
        }
    }, [index, startDrag, actions, isTouchingRef]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        actions.select(e, index);
        startDrag(e);
    }, [index, startDrag, actions]);

    const renderColumn = (column) => {
        const { _id, path, render, isHeader } = column;

        const options = {
            className: null
        };
        const defaultContent = _.get(data, path, index);
        const content = render(defaultContent, data, options);

        const CellType = isHeader ? 'th' : 'td';
        return <CellType
            key={`cell_${name}_${value}_${_id}`}
            className={options.className}
        >{content}</CellType>
    };

    const trClass = classNames(className, {
        [SelectedClass]: selected,
        [ActiveClass]: active
    });

    return <tr
        className={trClass}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
    >
        {columns.map(renderColumn)}
        <td/>
    </tr>;
}

export default React.memo(TableRow);
