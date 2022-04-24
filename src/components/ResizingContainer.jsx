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
        utils: { hooks, selectors, eventRaisers, options }
    } = props;

    const gestureRef = useRef({
        rowIndex: null,
        itemIndex: null,
        type: null
    }).current;

    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);
    const rowValues = hooks.useSelector(s => s.rowValues);
    const selection = hooks.useSelector(s => s.selection);

    const raiseItemsOpen = hooks.useSelectorGetter(eventRaisers.itemsOpen);
    const raiseContextMenu = hooks.useSelectorGetter(eventRaisers.contextMenu);

    const setGestureTarget = useCallback(rowIndex => {
        gestureRef.rowIndex = rowIndex;

        gestureRef.itemIndex = rowIndex;
        if (rowIndex >= 0)
            gestureRef.itemIndex += indexOffset
    }, [gestureRef, indexOffset]);

    const contextMenu = useCallback(e => {
        const { itemIndex, rowIndex } = gestureRef;

        if (e.altKey)
            raiseContextMenu(e.ctrlKey);
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
    }, [gestureRef, raiseContextMenu, options, selection, rowValues, actions, indexOffset]);

    const targetTouchStart = useCallback((e, includeChildren) => {
        if (!_.every(e.touches, t => includeChildren
            ? e.currentTarget.contains(t.target) : e.currentTarget === t.target)) return;

        e.stopPropagation();

        if (e.touches.length === 2) contextMenu(e);
    }, [contextMenu]);

    //#region Event handlers

    const handlePointerDown = useCallback(e => {
        gestureRef.type = e.pointerType;
    }, [gestureRef]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        const { itemIndex } = gestureRef;
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

        console.log("Drag select");
    }, [gestureRef, actions, options, indexOffset, rowValues]);

    const handleContextMenu = useCallback(e => {
        const { itemIndex } = gestureRef;
        if (gestureRef.type === "touch") {
            //Don't do anything if the header is the target
            if (itemIndex === GestureTargets.Header) return;

            if (itemIndex >= 0)
                actions.baseSelect(itemIndex, true, false);

            console.log("Drag start");
            return;
        }

        if (eventRaisers.isHandlerDefined("onContextMenu"))
            e.preventDefault();

        contextMenu(e);
    }, [gestureRef, contextMenu, actions, eventRaisers]);

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
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
    >
        <HeadContainer {...headProps} />
        <BodyContainer {...bodyProps} />
    </div>
}

export default React.memo(ResizingContainer);
