import React, {useCallback} from "react";
import TableHead from "./TableHead";
import ColumnGroup from "./ColumnGroup";

// Child of ResizingContainer
function HeadContainer(props) {
    const { tableClass, headColGroupRef, setGestureTarget, ...headProps } = props;

    const handlePointerDownCapture = useCallback(() => {
        setGestureTarget(-2);
    }, [setGestureTarget])

    return <div className="rst-headContainer"
                onPointerDownCapture={handlePointerDownCapture}
    >
        <table className={tableClass}>
            <ColumnGroup ref={headColGroupRef} />
            <TableHead {...headProps} />
        </table>
    </div>
}

export default React.memo(HeadContainer);
