import React from 'react';
import classNames from "classnames";
import TableCell from "./TableCell";

export const ActiveClass = "rst-active";
export const SelectedClass = "rst-selected";

export function getRowBounds(row) {
    const chunk = row?.offsetParent;
    if (!chunk) return null;

    const top = chunk.offsetTop + row.offsetTop;
    return {top, bottom: top + row.offsetHeight};
}

//Child of TableBody
function TableRow({
    columns,
    setGestureTarget,
    targetTouchStart,
    selected,
    active,
    index,
    className,
    name,
    value,
    data
}) {
    const renderColumn = ({_id: id, ...column}) =>
        <TableCell {...column}
                   rowData={data}
                   rowIndex={index}
                   key={`cell_${name}_${value}_${id}`}
        />

    const trClass = classNames(className, {
        "rst-row": true,
        [SelectedClass]: selected,
        [ActiveClass]: active
    });

    return <tr className={trClass}
                onPointerDownCapture={() => setGestureTarget(index)}
                onTouchStart={e => targetTouchStart(e, true)}
    >
        {columns.map(renderColumn)}
        <td className="rst-spacer"/>
    </tr>
}

export default React.memo(TableRow);
