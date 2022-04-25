import React from 'react';
import classNames from "classnames";
import TableCell from "./TableCell";

export const ActiveClass = "rst-active";
export const SelectedClass = "rst-selected";

//Child of TableBody
function TableRow({
    columns,
    setGestureTarget,
    targetTouchStart,
    selected,
    active,
    rowIndex,
    indexOffset,
    className,
    name,
    value,
    data
}) {
    const renderColumn = ({_id: id, ...column}) =>
        <TableCell {...column} data={data}
                   index={rowIndex + indexOffset}
                   key={`cell_${name}_${value}_${id}`}
        />

    const trClass = classNames(className, {
        [SelectedClass]: selected,
        [ActiveClass]: active
    });

    return <tr className={trClass}
               onPointerDownCapture={() => setGestureTarget(rowIndex)}
               onTouchStart={e => targetTouchStart(e, true)}
    >
        {columns.map(renderColumn)}
        <td/>
    </tr>
}

export default React.memo(TableRow);
