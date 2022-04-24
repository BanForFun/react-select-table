import React, {useRef, useContext, useCallback} from 'react';
import _ from "lodash";
import HeadContainer from "./HeadContainer";
import BodyContainer from "./BodyContainer";
import {ColumnGroupContext} from "./ColumnGroup";

//Child of ScrollingContainer
//Handles gestures
function ResizingContainer(props) {
    const {
        resizingContainerRef,

        //HeadContainer props
        scrollingContainerRef,
        headColGroupRef,
        columnResizeStart,

        //BodyContainer props
        getRowClassName,
        selectionRectRef,
        tableBodyRef,
        bodyContainerRef,
        placeholder,

        ...commonProps
    } = props;

    const {
        actions,
        utils: { hooks, selectors }
    } = props;

    const gestureRef = useRef({
        rowIndex: null,
        type: null
    }).current;

    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);

    const setGestureTarget = useCallback(rowIndex => {
        gestureRef.rowIndex = rowIndex;
    }, [gestureRef]);

    const handlePointerDown = useCallback(e => {
        gestureRef.type = e.pointerType;
        console.log(gestureRef);
    }, [gestureRef]);

    const handleTouchStart = useCallback(e => {
        if (e.targetTouches.length === 2) {
            console.log("Context menu");
        }
    }, []);

    const handleContextMenu = useCallback(e => {
        if (gestureRef.type === "touch") {
            actions.baseSelect(gestureRef.rowIndex + indexOffset, true, false);
            console.log("Drag start");
        }
        else
            console.log("Context menu");
    }, [gestureRef, indexOffset, actions]);

    Object.assign(commonProps, {
        setGestureTarget
    })

    const headProps = {
        ...commonProps,
        headColGroupRef,
        scrollingContainerRef,

        columnResizeStart
    }

    const bodyProps = {
        ...commonProps,
        tableBodyRef,
        selectionRectRef,
        bodyContainerRef,

        getRowClassName,
        placeholder
    }

    const { containerWidth, containerMinWidth } = useContext(ColumnGroupContext);

    return <div
        className="rst-resizingContainer"
        ref={resizingContainerRef}
        style={{ width: containerWidth, minWidth: containerMinWidth }}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onContextMenu={handleContextMenu}
    >
        <HeadContainer {...headProps} />
        <BodyContainer {...bodyProps} />
    </div>
}

export default React.memo(ResizingContainer);
