import React from 'react';
import _ from "lodash";
import classNames from "classnames";

export const ActiveClass = "rst-active";
export const SelectedClass = "rst-selected";

//Child of TableBody
function TableRow({
    columns,
    name,
    setGestureTarget,
    targetTouchStart,
    selected,
    active,
    data,
    value,
    rowIndex,
    className,
    indexOffset
}) {
    const index = rowIndex + indexOffset;

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

    return <tr className={trClass}
               onPointerDownCapture={() => setGestureTarget(rowIndex)}
               onTouchStart={e => targetTouchStart(e, true)}
    >
        {columns.map(renderColumn)}
        <td/>
    </tr>
}

export default React.memo(TableRow);
