import _ from "lodash";
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ResizingContainer from "./ResizingContainer";
import {ColumnGroupContext} from "./ColumnGroup";
import {DragModes, pc, px} from "../utils/tableUtils";
import useDecoupledCallback from "../hooks/useDecoupledCallback";
import {ActiveClass, SelectedClass} from "./TableRow";

const defaultColumnRenderer = value => value;

function parseColumn(col) {
    return {
        render: defaultColumnRenderer,
        ...col,
        _id: col.key ?? col.path
    }
}

const cancelScrollType = "touchmove";
const cancelScrollOptions = { passive: false };

const cancelWheelType = "wheel";
const cancelWheelOptions = { passive: false };

const Point = (x, y) => ({x, y});

const getClientX = element => element.getBoundingClientRect().x;
const getClientY = element => element.getBoundingClientRect().y;

function getLine(pointA, pointB) {
    const min = pointA < pointB ? pointA : pointB;
    const max = pointA > pointB ? pointA : pointB;

    return {
        origin: min,
        size: max - min
    };
}

function getRelativeOffset(absolute, origin, minVisible, maxVisible, scrollFactor) {
    const reference = _.clamp(absolute, minVisible, maxVisible);
    const scrollOffset = (absolute - reference) * scrollFactor;

    return  {
        scrollOffset,
        relToOrigin: Math.floor(reference - origin + scrollOffset),
        relToMin: reference - minVisible,
        relToMax: maxVisible - reference
    };
}

//Child of Root
//Handles drag selection and column resizing
function ScrollingContainer(props) {
    const {
        showSelectionRect,
        dragSelectScrollFactor,
        columnResizeScrollFactor,
        columns: unorderedColumns,
        columnOrder,
        initColumnWidths,
        ...resizingProps
    } = props;

    const {
        utils: { options, hooks, selectors, eventRaisers },
        actions,
        name
    } = props;

    //#region Column group

    const columns = useMemo(() =>
        (columnOrder?.map(index => unorderedColumns[index]) ?? unorderedColumns).map(parseColumn),
        [unorderedColumns, columnOrder]);

    const validateWidths = useCallback(widths => {
        const columnCount = columns.length;
        if (widths.length !== columnCount)
            widths = _.times(columnCount, _.constant(100 / columnCount));

        return widths;
    }, [columns])

    const getColumnGroup = useCallback(widths => {
        const columnsWidth = _.sum(widths);
        const spacerWidth = Math.max(0, 100 - columnsWidth);
        const containerWidth = columnsWidth + spacerWidth;
        const containerMinWidth = containerWidth / _.min(widths) * options.minColumnWidth

        return {
            columns, name,
            widths: widths.map(pc),
            spacerWidth: pc(spacerWidth),
            containerWidth: pc(containerWidth),
            containerMinWidth: px(containerMinWidth),
        }
    }, [columns, name, options]);

    const [columnGroup, setColumnGroup] = useState(getColumnGroup(validateWidths(initColumnWidths)));

    useEffect(() => {
        const validatedWidths = validateWidths(columnGroup.widths);
        if (validatedWidths !== columnGroup.widths)
            setColumnGroup(getColumnGroup(validatedWidths));
    }, [getColumnGroup, validateWidths, columnGroup])

    //#endregion

    //#region Elements

    const tableBodyRef = useRef();
    const selectionRectRef = useRef();
    const bodyContainerRef = useRef();
    const scrollingContainerRef = useRef();
    const headColGroupRef = useRef();
    const resizingContainerRef = useRef();

    const getRowBounds = useCallback(index => {
        const row = tableBodyRef.current.children[index];
        if (!row) return null;

        return {
            top: row.offsetTop,
            bottom: row.offsetTop + row.offsetHeight
        };
    }, []);

    //#endregion

    //#region Drag states

    const [dragMode, setDragMode] = useState(null);
    const drag = useRef({
        animationId: null,
        pointerPos: Point(),
        pointerId: null,
        movement: Point(0, 0)
    }).current;

    const columnResizing = useRef({
        widths: [],
        initialWidth: 0,
        movement: 0,
        index: -1
    }).current;

    const dragSelection = useRef({
        selection: {},
        selectionBuffer: {},
        activeIndex: null,
        pivotIndex: null,
        prevRowIndex: -1,
        prevRelY: 0
    }).current;

    //#endregion

    //#region Drag ending

    //Column resizing
    const raiseColumnResizeEnd = hooks.useSelectorGetter(eventRaisers.columnResizeEnd);
    const columnResizeEnd = useCallback(() => {
        const container = scrollingContainerRef.current;
        const widths = columnResizing.widths.map(px => 100 * px / container.clientWidth);
        raiseColumnResizeEnd(widths);
        setColumnGroup(getColumnGroup(widths));

        bodyContainerRef.current.style.width = "100%";
    }, [columnResizing, setColumnGroup, getColumnGroup, raiseColumnResizeEnd]);

    //Drag selection
    const rowValues = hooks.useSelector(s => s.rowValues);
    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);
    const dragSelectEnd = useCallback(() => {
        if (dragSelection.activeIndex == null) return;
        actions.setSelected(
            _.mapKeys(dragSelection.selection, (_, rowIndex) => rowValues[rowIndex]),
            dragSelection.activeIndex + indexOffset,
            dragSelection.pivotIndex + indexOffset
        );
    }, [dragSelection, actions, rowValues, indexOffset]);

    //Common
    const dragEnd = useMemo(() => ({
        [DragModes.Resize]: columnResizeEnd,
        [DragModes.Select]: dragSelectEnd
    })[dragMode?.name], [dragMode, columnResizeEnd, dragSelectEnd]);

    const dragStop = useCallback(() => {
        if (drag.pointerId != null) {
            scrollingContainerRef.current.releasePointerCapture(drag.pointerId);
            drag.pointerId = null;
        }
        //Animation hasn't yet finished, we will be called again when it does
        if (drag.animationId != null) return;

        setDragMode(null);
        dragEnd();
    }, [drag, dragEnd]);

    //#endregion

    //#region Drag animation

    //Common
    const dragAnimate = useCallback((animation, ...params) => {
        cancelAnimationFrame(drag.animationId);
        drag.animationId = requestAnimationFrame(() => {
            animation(...params);
            drag.animationId = null;
            drag.movement.x = 0;
            drag.movement.y = 0;

            //Drag ended while doing animation
            if (drag.pointerId == null) setTimeout(dragStop, 0);
        });
    }, [drag, dragStop]);

    //Column resizing
    const columnResizeAnimation = useCallback((changedWidths, scrollLeft) => {
        const colGroup = headColGroupRef.current;
        const container = scrollingContainerRef.current;

        for (let index in changedWidths)
            colGroup.children[index].width = px(changedWidths[index]);

        container.scrollLeft = scrollLeft;

        bodyContainerRef.current.style.width = (
            columnResizing.initialWidth <= container.clientWidth ||
            columnResizing.initialWidth <= _.sum(columnResizing.widths)
        ) ? "100%" : 0;
    }, [columnResizing]);

    const dragSelectAnimate = useCallback((
        relX, relY, scrollLeftOffset, scrollTopOffset
    ) => {
        //Animate scrolling
        const container = scrollingContainerRef.current;
        container.scrollLeft += scrollLeftOffset;
        container.scrollTop += scrollTopOffset;

        //Animate rectangle
        const {originRel} = dragSelection;
        const lineX = getLine(relX, originRel.x);
        const lineY = getLine(relY, originRel.y);

        Object.assign(selectionRectRef.current.style, _.mapValues({
            left: lineX.origin, width: lineX.size,
            top: lineY.origin, height: lineY.size
        }, px));

        //Animate selection
        const body = tableBodyRef.current;
        const rows = body.children;
        _.forEach(dragSelection.selectionBuffer, (selected, index) => {
            rows[index].classList.toggle(SelectedClass, selected);
        });
        dragSelection.selectionBuffer = {};

        //Animate active row
        if (dragSelection.activeIndex == null) return;

        const prevActiveRow = body.getElementsByClassName(ActiveClass)[0];
        prevActiveRow.classList.remove(ActiveClass);

        const newActiveRow = rows[dragSelection.activeIndex];
        newActiveRow.classList.add(ActiveClass);
    }, [dragSelection]);

    //#endregion

    //#region Drag updating

    //Column resizing
    const columnResizeUpdate = useCallback(() => {
        const { index } = dragMode;
        const { widths } = columnResizing;
        const { constantWidth, minColumnWidth: minWidth } = options;

        const container = scrollingContainerRef.current;
        const containerX = getClientX(container);
        const { clientWidth: containerWidth, scrollLeft: containerScroll } = container;

        //Auto-scroll
        const distanceToEnd = _.sum(_.slice(widths, index + 1));
        const shrinkThresholdColumn = containerScroll && widths[index] > minWidth
            ? containerWidth - distanceToEnd : 0
        const shrinkThreshold = containerX + Math.max(0, shrinkThresholdColumn);
        const expandThreshold = containerX + containerWidth;

        const { relToOrigin: relX, scrollOffset } = getRelativeOffset(
            drag.pointerPos.x, getClientX(headColGroupRef.current),
            shrinkThreshold, expandThreshold, columnResizeScrollFactor
        );

        //Scroll with second finger
        let movementOffset = 0;
        if (relX + distanceToEnd > containerWidth) {
            const availableScroll = constantWidth ?
                columnResizing.initialWidth - containerWidth - containerScroll : Infinity;

            movementOffset = _.clamp(drag.movement.x, -containerScroll, availableScroll);
        }

        //Set column widths
        const availableWidth = constantWidth ? widths[index] + widths[index + 1] : Infinity;
        const left = _.sum(_.take(widths, index));
        const targetWidth = relX + movementOffset - left;

        const changedWidths = {};
        changedWidths[index] = _.clamp(targetWidth, minWidth, availableWidth - minWidth);

        if (constantWidth)
            changedWidths[index + 1] = availableWidth - changedWidths[index];

        //Handle overscroll
        const overscroll = targetWidth !== changedWidths[index];
        const absPos = _.clamp(drag.pointerPos.x - containerX, 0, containerWidth);
        const scrollLeft = !overscroll && (scrollOffset || movementOffset)
            ? left + changedWidths[index] - absPos
            : containerScroll + scrollOffset + movementOffset;

        Object.assign(columnResizing.widths, changedWidths);

        dragAnimate(columnResizeAnimation, changedWidths, scrollLeft);
    }, [
        drag,
        columnResizing,
        columnResizeAnimation,
        columnResizeScrollFactor,
        dragAnimate,
        options,
        dragMode
    ]);

    //Drag selection
    const dragSelectUpdate = useCallback(() => {
        //Calculate selection rectangle
        const bodyContainer = bodyContainerRef.current;
        const container = scrollingContainerRef.current;
        const containerBounds = container.getBoundingClientRect();

        const visibleTop = containerBounds.top + bodyContainer.offsetTop;
        const visibleLeft = containerBounds.left;
        const visibleRight = containerBounds.left + container.clientWidth;
        const visibleBottom = containerBounds.top + container.clientHeight

        const { pointerPos, movement } = drag;

        const { relToOrigin: relX, scrollOffset: scrollLeftOffset, relToMin: left, relToMax: right } =
            getRelativeOffset(pointerPos.x, getClientX(bodyContainer),
            visibleLeft, visibleRight, dragSelectScrollFactor);

        const { relToOrigin: relY, scrollOffset: scrollTopOffset, relToMin: top, relToMax: bottom } =
            getRelativeOffset(pointerPos.y, getClientY(bodyContainer),
            visibleTop, visibleBottom, dragSelectScrollFactor);

        //Calculate selection
        const newRelY = _.clamp(relY + movement.y, top, bodyContainer.clientHeight - bottom);

        const { selectionBuffer } = dragSelection;
        const direction = Math.sign(newRelY - dragSelection.prevRelY);

        if (direction) {
            const doSelect = Math.sign(newRelY - dragSelection.originRel.y) === direction;

            const tableBody = tableBodyRef.current;
            const rowCount = tableBody.children.length;
            const shouldBeSelected = (index) => {
                if (index === rowCount)
                    return (!doSelect && newRelY > tableBody.offsetHeight);

                const bounds = getRowBounds(index);
                return bounds && (direction > 0 ? bounds.top <= newRelY : bounds.bottom >= newRelY);
            }

            //Start checking from next row (in the direction the pointer has moved)
            for (let rowIndex = dragSelection.prevRowIndex + direction;
                shouldBeSelected(rowIndex);
                rowIndex += direction
            ) {
                //rowIndex is the last row that should be selected
                const rowToUpdate = doSelect ? rowIndex : dragSelection.prevRowIndex;
                selectionBuffer[rowToUpdate] = doSelect;
                dragSelection.prevRowIndex = rowIndex;

                getSelection().removeAllRanges();

                if (rowIndex >= rowCount) continue;
                dragSelection.activeIndex = rowIndex;
                dragSelection.pivotIndex ??= rowIndex;
            }

            dragSelection.prevRelY = newRelY;
            Object.assign(dragSelection.selection, selectionBuffer);
        }

        dragAnimate(dragSelectAnimate,
            _.clamp(relX + movement.x, left, bodyContainer.clientWidth - right),
            newRelY,
            scrollLeftOffset + movement.x,
            scrollTopOffset + movement.y
        );

    }, [
        drag, dragAnimate,
        dragSelectAnimate, dragSelection, dragSelectScrollFactor,
        getRowBounds
    ]);

    //Common
    const dragUpdate = useMemo(() => ({
        [DragModes.Resize]: columnResizeUpdate,
        [DragModes.Select]: dragSelectUpdate
    })[dragMode?.name], [dragMode, columnResizeUpdate, dragSelectUpdate]);

    //#endregion

    //#region Drag starting

    //Common
    const cancelScrollHandler = useDecoupledCallback(useCallback(e => {
        if (e.cancelable)
            e.preventDefault();
        else if (drag.pointerId != null) //Stop dragging if browser gesture is in progress
            dragStop();
    }, [drag, dragStop]));

    const cancelWheelHandler = useDecoupledCallback(useCallback(e => {
        e.preventDefault();

        drag.movement.x += e.shiftKey ? e.deltaY : e.deltaX;
        drag.movement.y += e.shiftKey ? e.deltaX : e.deltaY;

        dragUpdate();
    }, [drag, dragUpdate]))

    const dragStart = useCallback((x, y, pointerId, dragMode, extra = null) => {
        Object.assign(drag, {
            pointerPos: Point(x, y),
            pointerId
        });

        const container = scrollingContainerRef.current;
        container.setPointerCapture(pointerId);
        container.addEventListener(cancelScrollType, cancelScrollHandler, cancelScrollOptions);
        container.addEventListener(cancelWheelType, cancelWheelHandler, cancelWheelOptions);

        setDragMode({ name: dragMode, ...extra });
    }, [drag, cancelScrollHandler, cancelWheelHandler]);

    useEffect(() => {
        if (dragMode) return;

        const container = scrollingContainerRef.current;
        container.removeEventListener(cancelScrollType, cancelScrollHandler, cancelScrollOptions);
        container.removeEventListener(cancelWheelType, cancelWheelHandler, cancelWheelOptions);
    }, [dragMode, cancelScrollHandler, cancelWheelHandler]);

    //Column resizing
    const columnResizeStart = useCallback((x, y, pointerId, index) => {
        const container = scrollingContainerRef.current;

        Object.assign(columnResizing, {
            widths: _.initial(_.map(headColGroupRef.current.children, col => col.getBoundingClientRect().width)),
            initialWidth: container.scrollWidth,
            movement: 0
        });

        setColumnGroup(columnGroup => ({
            ...columnGroup,
            widths: columnResizing.widths.map(px),
            spacerWidth: "100%",
            containerWidth: "fit-content",
            containerMinWidth: "0px"
        }));

        dragStart(x, y, pointerId, DragModes.Resize, { index });
    }, [dragStart, columnResizing]);

    //Drag selection
    const dragSelectStart = useCallback((x, y, pointerId, rowIndex) => {
        const body = tableBodyRef.current;
        const relX = x - getClientX(body);
        const relY = y - getClientY(body);

        Object.assign(dragSelection, {
            selection: {},
            activeIndex: null,
            pivotIndex: rowIndex < 0 ? null : rowIndex,
            prevRowIndex: rowIndex < 0 ? body.children.length : rowIndex,
            prevRelY: relY,
            originRel: Point(relX, relY)
        });

        dragStart(x, y, pointerId, DragModes.Select);
    }, [dragStart, dragSelection]);

    //#endregion

    //#region Event handlers

    const handleScroll = useCallback(() => {
        if (drag.pointerId == null) return;
        dragUpdate?.();
    }, [drag, dragUpdate]);

    const handlePointerMove = useCallback(e => {
        if (drag.pointerId == null) return;
        if (e.pointerId === drag.pointerId) {
            drag.pointerPos = Point(e.clientX, e.clientY);
        } else {
            drag.movement.x -= e.movementX;
            drag.movement.y -= e.movementY;
        }

        dragUpdate?.();
    }, [drag, dragUpdate]);

    const handlePointerUp = useCallback(e => {
        if (drag.pointerId == null) return;
        if (e.pointerId !== drag.pointerId) return;
        dragStop();
    }, [drag, dragStop]);

    //#endregion

    //Set props
    Object.assign(resizingProps,{
        bodyContainerRef,
        tableBodyRef,
        selectionRectRef,
        scrollingContainerRef,
        resizingContainerRef,
        headColGroupRef,

        dragMode,
        columns,

        columnResizeStart,
        dragSelectStart,
        getRowBounds
    });

    return <div
        className="rst-scrollingContainer"
        ref={scrollingContainerRef}
        data-dragmode={dragMode?.name}
        onScroll={handleScroll}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
    >
        <ColumnGroupContext.Provider value={columnGroup}>
            <ResizingContainer {...resizingProps} />
        </ColumnGroupContext.Provider>
    </div>
}

export default ScrollingContainer;
