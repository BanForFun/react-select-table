import React from 'react';
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";
import {DragModes, GestureTargets} from "../utils/tableUtils";

//Child of ResizingContainer
function BodyContainer(props) {
    const {
        tableClass,
        selectionRectRef,
        placeholder,
        ...bodyProps
    } = props;

    const {
        setGestureTarget,
        targetTouchStart,
        bodyContainerRef,
        dragMode
    } = props;

    return <div
        className="rst-bodyContainer"
        ref={bodyContainerRef}
        onPointerDownCapture={() => setGestureTarget(GestureTargets.BelowItems)}
        onTouchStart={e => targetTouchStart(e, false)}
    >
        {dragMode?.name === DragModes.Select &&
            <div className="rst-dragSelection" ref={selectionRectRef} />}

        {placeholder || <table className={tableClass}>
            <ColumnGroup />
            <TableBody {...bodyProps} />
        </table>}
    </div>
}

export default BodyContainer;
