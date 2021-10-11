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
    indexOffset,
    utils: {options}
}) {
    const index = rowIndex + indexOffset;

    // const raiseContextMenu = hooks.useSelectorGetter(eventRaisers.contextMenu);

    const startDrag = useCallback(e => {
        dragSelectStart([e.clientX, e.clientY], rowIndex);
    }, [rowIndex, dragSelectStart]);

    const contextMenu = useCallback(e => {
        if (options.listBox || selected)
            actions.baseSetActive(index, true);
        else
            actions.baseSelect(index, e.ctrlKey, e.shiftKey, true);
    }, [index, options, actions, selected])

    const handleContextMenu = useCallback(e => {
        if (!isTouchingRef.current)
            return contextMenu(e);

        actions.baseSelect(index, true, false);
        startDrag(e);
    }, [index, contextMenu, startDrag]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        actions.select(e, index);
        if (isTouchingRef.current) return;

        startDrag(e);
    }, [index, startDrag, actions]);

    const handleTouchStart = useCallback(e => {
        //Td is touch target
        const withinRow = [...e.touches].filter(touch =>
            touch.target.parentNode === e.currentTarget);
        if (withinRow.length < 2) return;

        contextMenu(e);
    }, [contextMenu]);

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
        onTouchStart={handleTouchStart}
    >
        {columns.map(renderColumn)}
        <td/>
    </tr>;
}

export default React.memo(TableRow);
