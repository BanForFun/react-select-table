import React, {useCallback} from 'react';
import _ from "lodash";
import classNames from "classnames";
import {DragModes} from "../utils/tableUtils";

export const ActiveClass = "rst-active";
export const SelectedClass = "rst-selected";

//Child of TableBody
function TableRow({
    columns,
    name,
    actions,
    dragSelectStart,
    setDragSelectionOriginIndex,
    selected,
    active,
    data,
    value,
    rowIndex,
    className,
    indexOffset,
    dragMode,
    utils: { options, eventRaisers, hooks }
}) {
    const index = rowIndex + indexOffset;

    // const raiseContextMenu = hooks.useSelectorGetter(eventRaisers.contextMenu);
    //
    // const startDrag = useCallback(e => {
    //     selection.absX = e.clientX;
    //     selection.absY = e.clientY;
    //     dragSelectStart(rowIndex);
    // }, [rowIndex, dragSelectStart, selection]);
    //
    // const contextMenu = useCallback(e => {
    //     if (e.shiftKey)
    //         raiseContextMenu(true);
    //     else if (e.ctrlKey)
    //         raiseContextMenu();
    //     else if (options.listBox || selected)
    //         actions.baseSetActive(index, true);
    //     else
    //         actions.baseSelect(index, false, false, true);
    //
    //     if (eventRaisers.isHandlerDefined("onContextMenu"))
    //         e.preventDefault();
    //
    // }, [raiseContextMenu, options, selected, actions, index, eventRaisers])

    // const handleContextMenu = useCallback(e => {
    //     if (!isTouchingRef.current)
    //         return contextMenu(e);
    //
    //     actions.baseSelect(index, true, false);
    //     startDrag(e);
    // }, [isTouchingRef, contextMenu, actions, index, startDrag]);

    // const handleMouseDown = useCallback(e => {
    //     if (e.button !== 0) return;
    //
    //     actions.select(e, index);
    //     if (isTouchingRef.current) return;
    //
    //     startDrag(e);
    // }, [actions, index, isTouchingRef, startDrag]);

    // const handleTouchStart = useCallback(e => {
    //     //Td is touch target
    //     const withinRow = [...e.touches].filter(touch =>
    //         touch.target.parentNode === e.currentTarget);
    //     if (withinRow.length < 2) return;
    //
    //     contextMenu(e);
    // }, [contextMenu]);

    const handlePointerDown = useCallback(() => {
        setDragSelectionOriginIndex(rowIndex)
    }, [setDragSelectionOriginIndex, rowIndex]);

    const renderColumn = (column, colIndex) => {
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
        data-index={rowIndex}
        onPointerDownCapture={handlePointerDown}
    >
        {columns.map(renderColumn)}
        <td/>
    </tr>;
}

export default React.memo(TableRow);
