import React, {useRef, useContext, useCallback} from 'react';
import _ from "lodash";
import {GestureTargets} from "../utils/tableUtils";
import TableBody from "./TableBody";
import TableHead from "./TableHead";
import ColumnGroupContext from "../context/ColumnGroup";

//Child of ScrollingContainer
//Handles gestures
function ResizingContainer(props) {
    const {
        //Own props
        resizingContainerRef,
        dragSelectStart,

        //HeadContainer props
        tableHeaderRowRef,
        columnResizeStart,
        actions,

        //BodyContainer props
        getRowClassName,
        selectionRectRef,
        tableBodyRef,
        placeholder,
        getChunkRow,
        chunkIntersectionObserver,

        ...commonProps
    } = props;

    const {
        utils: { hooks, selectors, eventRaisers, options }
    } = props;

    const gesture = useRef({
        pointerId: null,
        rowIndex: null,
        itemIndex: null,
        pointerType: null
    }).current;

    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);
    const rowCount = hooks.useSelector(s => s.rowValues.length);
    const noSelection = hooks.useSelector(s => !s.selection.size);

    const getSelected = hooks.useSelectorGetter(selectors.getSelected);

    const raiseItemsOpen = hooks.useSelectorGetter(eventRaisers.itemsOpen);
    const raiseContextMenu = hooks.useSelectorGetter(eventRaisers.contextMenu);

    const contextMenu = useCallback(e => {
        const { itemIndex, rowIndex } = gesture;

        if (e.altKey)
            raiseContextMenu(!e.ctrlKey);
        else if (itemIndex === GestureTargets.Header)
            raiseContextMenu(true);
        else if (itemIndex === GestureTargets.BelowItems) {
            if (e.shiftKey)
                actions.baseSelect(indexOffset + rowCount - 1, e.ctrlKey, e.shiftKey, true);
            else if (!options.listBox && !e.ctrlKey)
                actions.baseClearSelection(true)
            else
                raiseContextMenu(!e.ctrlKey);
        } else if (options.listBox || (getSelected(rowIndex) && !e.ctrlKey))
            actions.baseSetActive(itemIndex, true);
        else
            actions.baseSelect(itemIndex, e.ctrlKey, e.shiftKey, true);
    }, [gesture, raiseContextMenu, options, rowCount, actions, indexOffset, getSelected]);

    const dragSelect = useCallback(e => {
        if (gesture.pointerId == null) return;
        dragSelectStart(e.clientX, e.clientY, gesture.pointerId, gesture.rowIndex);
    }, [gesture, dragSelectStart]);

    const targetTouchStart = useCallback((e, includeChildren) => {
        if (!_.every(e.touches, t => includeChildren
            ? e.currentTarget.contains(t.target) : e.currentTarget === t.target)) return;

        e.stopPropagation();

        if (e.touches.length === 2) contextMenu(e);
    }, [contextMenu]);

    const setGestureTarget = useCallback((rowIndex) => {
        gesture.rowIndex = rowIndex;
        gesture.itemIndex = rowIndex;
        if (rowIndex >= 0)
            gesture.itemIndex += indexOffset
    }, [gesture, indexOffset]);

    //#region Event handlers

    const handlePointerDown = useCallback(e => {
        gesture.pointerType = e.pointerType;
        gesture.pointerId = e.isPrimary ? e.pointerId : null;
    }, [gesture]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        const { itemIndex } = gesture;
        switch(itemIndex) {
            case GestureTargets.Header: return;
            case GestureTargets.BelowItems:
                if (e.shiftKey)
                    actions.select(e, indexOffset + rowCount);
                else if (!options.listBox && !e.ctrlKey)
                    actions.baseClearSelection();

                break;
            default:
                actions.select(e, itemIndex);
                break;
        }

        if (gesture.pointerType === "mouse")
            dragSelect(e);
    }, [gesture, actions, options, indexOffset, rowCount, dragSelect]);

    const handleContextMenu = useCallback(e => {
        if (e.shiftKey) return; //Show browser context menu when holding shift

        const { itemIndex } = gesture;
        if (gesture.pointerType !== "mouse") {
            //Don't do anything if the header is the target
            if (itemIndex === GestureTargets.Header) return;

            if (itemIndex >= 0)
                actions.baseSelect(itemIndex, true, false);

            return dragSelect(e);
        }

        if (eventRaisers.isHandlerDefined("onContextMenu"))
            e.preventDefault();

        contextMenu(e);
    }, [gesture, contextMenu, actions, eventRaisers, dragSelect]);

    const handleDoubleClick = useCallback(() => {
        if (noSelection) return;
        raiseItemsOpen(false);
    }, [noSelection, raiseItemsOpen]);

    //#endregion

    Object.assign(commonProps, {
        setGestureTarget,
        targetTouchStart
    });

    const headProps = {
        ...commonProps,
        tableHeaderRowRef,
        actions,

        columnResizeStart
    }

    const bodyProps = {
        ...commonProps,
        tableBodyRef,
        selectionRectRef,

        chunkIntersectionObserver,
        getRowClassName,
        getChunkRow,
        placeholder
    }

    const { containerWidth, containerMinWidth } = useContext(ColumnGroupContext);

    return <div
        className="rst-resizingContainer"
        ref={resizingContainerRef}
        style={{ width: containerWidth, minWidth: containerMinWidth }}
        onPointerDownCapture={() => setGestureTarget(GestureTargets.BelowItems)}
        onTouchStart={e => targetTouchStart(e, false)}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
    >
        <TableHead {...headProps} />
        <TableBody {...bodyProps} />
    </div>
}

export default ResizingContainer;
