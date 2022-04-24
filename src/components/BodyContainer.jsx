import React from 'react';
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";
import {GestureTargets} from "../utils/tableUtils";

//Child of ResizingContainer
function BodyContainer(props) {
    const {
        tableClass,
        selectionRectRef,
        placeholder,
        ...bodyProps
    } = props;

    const {
        bodyContainerRef,
        setGestureTarget,
        targetTouchStart
    } = props;

    return <div
        className="rst-bodyContainer"
        ref={bodyContainerRef}
        onPointerDownCapture={() => setGestureTarget(GestureTargets.BelowItems)}
        onTouchStart={e => targetTouchStart(e, false)}
    >
        <div className="rst-dragSelection" ref={selectionRectRef} />
        {placeholder || <table className={tableClass}>
            <ColumnGroup />
            <TableBody {...bodyProps} />
        </table>}
    </div>
}

export default React.memo(BodyContainer);
