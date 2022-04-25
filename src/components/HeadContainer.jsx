import React from "react";
import TableHead from "./TableHead";
import ColumnGroup from "./ColumnGroup";
import {GestureTargets} from "../utils/tableUtils";

// Child of ResizingContainer
function HeadContainer(props) {
    const {
        tableClass,
        headColGroupRef,
        setGestureTarget,
        targetTouchStart,
        ...headProps
    } = props;

    return <div className="rst-headContainer"
                onPointerDownCapture={() => setGestureTarget(GestureTargets.Header)}
                onTouchStart={e => targetTouchStart(e, true)}
    >
        <table className={tableClass}>
            <ColumnGroup ref={headColGroupRef} />
            <TableHead {...headProps} />
        </table>
    </div>
}

export default HeadContainer;
