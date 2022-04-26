import React, {useRef, useContext, useCallback} from 'react';
import _ from "lodash";
import HeadContainer from "./HeadContainer";
import BodyContainer from "./BodyContainer";
import {ColumnGroupContext} from "./ColumnGroup";
import {GestureTargets} from "../utils/tableUtils";

//Child of ScrollingContainer
//Handles gestures
function ResizingContainer(props) {
    const {
        //Own props
        resizingContainerRef,
        dragSelectStart,

        //HeadContainer props
        headColGroupRef,
        columnResizeStart,
        actions,

        //BodyContainer props
        getRowClassName,
        selectionRectRef,
        tableBodyRef,
        bodyContainerRef,
        placeholder,
        getRowBounds,

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
    const rowValues = hooks.useSelector(s => s.rowValues);
    const selection = hooks.useSelector(s => s.selection);

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
                actions.baseSelect(indexOffset + rowValues.length - 1, e.ctrlKey, e.shiftKey, true);
            else if (!options.listBox && !e.ctrlKey)
                actions.baseClearSelection(true)
            else
                raiseContextMenu(!e.ctrlKey);
        } else if (options.listBox || (selection.has(rowValues[rowIndex]) && !e.ctrlKey))
            actions.baseSetActive(itemIndex, true);
        else
            actions.baseSelect(itemIndex, e.ctrlKey, e.shiftKey, true);
    }, [gesture, raiseContextMenu, options, selection, rowValues, actions, indexOffset]);

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
                    actions.select(e, indexOffset + rowValues.length - 1);
                else if (!options.listBox && !e.ctrlKey)
                    actions.baseClearSelection();

                break;
            default:
                actions.select(e, itemIndex);
                break;
        }

        if (gesture.pointerType === "mouse")
            dragSelect(e);
    }, [gesture, actions, options, indexOffset, rowValues, dragSelect]);

    const handleContextMenu = useCallback(e => {
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
        if (!selection.size) return;
        raiseItemsOpen(false);
    }, [selection.size, raiseItemsOpen]);

    //#endregion

    Object.assign(commonProps, {
        setGestureTarget,
        targetTouchStart
    });

    const headProps = {
        ...commonProps,
        headColGroupRef,
        actions,

        columnResizeStart
    }

    const bodyProps = {
        ...commonProps,
        tableBodyRef,
        selectionRectRef,
        bodyContainerRef,

        getRowClassName,
        getRowBounds,
        placeholder
    }

    const { containerWidth, containerMinWidth } = useContext(ColumnGroupContext);

    return <div
        className="rst-resizingContainer"
        ref={resizingContainerRef}
        style={{ width: containerWidth, minWidth: containerMinWidth }}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
    >
        <HeadContainer {...headProps} />
        <BodyContainer {...bodyProps} />
    </div>
}

export default ResizingContainer;
