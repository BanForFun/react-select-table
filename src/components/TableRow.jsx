import React, {useCallback, useEffect, useRef} from 'react';
import _ from "lodash";
import TableCell from "./TableCell";
import {boolAttribute} from "../utils/elementUtils";

//Child of TableBody
function TableRow({
    columns,
    name,
    actions,
    isTouchingRef,
    dragSelectStart,
    selected,
    active,
    item,
    value,
    index,
    bodyContainerRef
}) {
    const trRef = useRef();

    useEffect(() => {
        if (!active) return;

        //Get elements
        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const tr = trRef.current;

        //Scroll up
        const scrollUp = tr.offsetTop < root.scrollTop;
        if (scrollUp)
            root.scrollTop = tr.offsetTop;

        //Scroll down
        const visibleHeight = root.clientHeight - body.offsetTop;
        const rowBottom = tr.offsetTop + tr.offsetHeight;
        const scrollDown = rowBottom > (root.scrollTop + visibleHeight);
        if (scrollDown)
            root.scrollTop = rowBottom - visibleHeight;

    }, [active]);

    const handleContextMenu = useCallback(e => {
        e.stopPropagation();

        if (isTouchingRef.current) {
            actions.baseSelect(value, true, false);
            dragSelectStart([e.clientX, e.clientY], index);
        } else {
            actions.contextMenu(value, e);
        }
    }, [value, index, actions]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        e.stopPropagation();

        actions.select(value, e);
        dragSelectStart([e.clientX, e.clientY], index);
    }, [value, index, actions]);

    const renderColumn = (column) => {
        const { _id, path, render, className, isHeader } = column;

        const cellProps = {
            content: _.getOrSource(item, path),
            key: `cell_${name}_${value}_${_id}`,
            className, isHeader, render, item
        }

        return <TableCell {...cellProps} />
    };

    return <tr
        ref={trRef}
        data-selected={boolAttribute(selected)}
        data-active={boolAttribute(active)}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
    >
        {columns.map(renderColumn)}
        <td/>
    </tr>;
}

export default React.memo(TableRow);
