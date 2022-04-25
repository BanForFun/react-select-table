import _ from "lodash";
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ResizingContainer from "./ResizingContainer";
import {ColumnGroupContext} from "./ColumnGroup";
import {DragModes} from "../utils/tableUtils";
import useDecoupledCallback from "../hooks/useDecoupledCallback";

const px = n => `${n}px`;
const pc = n => `${n}%`;

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

const Point = (x, y) => ({x, y});

const getClientX = element => element.getBoundingClientRect().x;
const getClientY = element => element.getBoundingClientRect().y;

function getRelativeOffset(
    absolute, origin,
    shrinkThreshold, expandThreshold, scrollFactor
) {
    const reference = _.clamp(absolute, shrinkThreshold, expandThreshold);
    const scrollOffset = (absolute - reference) * scrollFactor;

    return  {
        relative: Math.floor(reference - origin + scrollOffset),
        scrollOffset
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

    //#region Element refs

    const tableBodyRef = useRef();
    const selectionRectRef = useRef();
    const bodyContainerRef = useRef();
    const scrollingContainerRef = useRef();
    const headColGroupRef = useRef();
    const resizingContainerRef = useRef();

    //#endregion

    //#region Drag states

    const [dragMode, setDragMode] = useState(null);

    const drag = useRef({
        animationId: null,
        pointerPos: Point(),
        pointerId: null
    }).current;

    const columnResizing = useRef({
        widths: [],
        initialWidth: 0,
        movementBuffer: 0,
        index: -1
    }).current;

    const dragSelection = useRef({
        selection: {
            selected: {},
            active: null,
            pivot: null
        },
        origin: {
            relX: null,
            relY: null,
            rowIndex: null
        },
        prevRowIndex: null
    }).current;

    //#endregion

    //#region Drag ending

    const raiseColumnResizeEnd = hooks.useSelectorGetter(eventRaisers.columnResizeEnd);
    const columnResizeEnd = useCallback(() => {
        const container = scrollingContainerRef.current;
        const widths = columnResizing.widths.map(px => 100 * px / container.clientWidth);
        raiseColumnResizeEnd(widths);
        setColumnGroup(getColumnGroup(widths));

        bodyContainerRef.current.style.width = "100%";
    }, [columnResizing, setColumnGroup, getColumnGroup, raiseColumnResizeEnd]);

    const dragSelectEnd = useCallback(() => {

    }, []);

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

    const dragAnimate = useCallback((animation, ...params) => {
        cancelAnimationFrame(drag.animationId);
        drag.animationId = requestAnimationFrame(() => {
            animation(...params);
            drag.animationId = null;
            if (drag.pointerId == null) //Drag ended while doing animation
                setTimeout(dragStop, 0);
        });
    }, [drag, dragStop]);

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

        columnResizing.movementBuffer = 0;
    }, [columnResizing]);

    // const applyRectStyles = useCallback(styles => {
    //     Object.assign(selectionRectRef.current.style, styles);
    // }, [selectionRectRef]);

    //#endregion

    //#region Drag updating

    const dragSelectUpdate = useCallback((movement) => {
        if (movement) {
            const container = scrollingContainerRef.current;
            container.scrollLeft -= movement.x;
            container.scrollTop -= movement.y;
        }
    }, []);

    const columnResizeUpdate = useCallback((movement = null) => {
        const { index } = dragMode;
        const { widths } = columnResizing;
        const { constantWidth, minColumnWidth: minWidth } = options;

        const container = scrollingContainerRef.current;

        //Auto-scroll
        const distanceToEnd = _.sum(_.slice(widths, index + 1));
        const shrinkThresholdColumn = container.scrollLeft && widths[index] > minWidth
            ? container.clientWidth - distanceToEnd : 0
        const expandThreshold = getClientX(container) + container.clientWidth;
        const shrinkThreshold = getClientX(container) + Math.max(0, shrinkThresholdColumn);

        const { relative: relX, scrollOffset } = getRelativeOffset(
            drag.pointerPos.x, getClientX(headColGroupRef.current),
            shrinkThreshold, expandThreshold, columnResizeScrollFactor
        );

        //Scroll with second finger
        let movementOffset = 0;
        if (relX + distanceToEnd > container.clientWidth) {
            const availableScroll = constantWidth ?
                columnResizing.initialWidth - container.clientWidth - container.scrollLeft : Infinity;

            movementOffset = _.clamp(
                columnResizing.movementBuffer -= movement?.x ?? 0,
                -container.scrollLeft, availableScroll
            );
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
        const absPos = _.clamp(drag.pointerPos.x - getClientX(container), 0, container.clientWidth);
        const scrollLeft = !overscroll && (scrollOffset || movementOffset)
            ? left + changedWidths[index] - absPos
            : container.scrollLeft + scrollOffset + movementOffset;

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

    const dragUpdate = useMemo(() => ({
        [DragModes.Resize]: columnResizeUpdate,
        [DragModes.Select]: dragSelectUpdate
    })[dragMode?.name], [dragMode, columnResizeUpdate, dragSelectUpdate]);

    //#endregion

    //#region Drag starting

    const cancelScrollHandler = useDecoupledCallback(useCallback(e => {
        if (e.cancelable)
            e.preventDefault();
        else if (drag.pointerId != null)
            dragStop();
    }, [drag, dragStop]));

    const dragStart = useCallback((x, y, pointerId, dragMode, extra = null) => {
        drag.pointerPos = Point(x, y);
        drag.pointerId = pointerId;

        scrollingContainerRef.current.setPointerCapture(pointerId);
        window.addEventListener(cancelScrollType, cancelScrollHandler, cancelScrollOptions);
        setDragMode({ name: dragMode, ...extra });
    }, [drag, cancelScrollHandler]);

    useEffect(() => {
        if (dragMode) return;
        window.removeEventListener(cancelScrollType, cancelScrollHandler, cancelScrollOptions);
    }, [dragMode, cancelScrollHandler]);

    const dragSelectStart = useCallback((x, y, pointerId, rowIndex) => {
        dragStart(x, y, pointerId, DragModes.Select);
    }, [dragStart]);

    const columnResizeStart = useCallback((x, y, pointerId, index) => {
        /* clientWidth instead of clientRect.width to ensure that the same amount of the column resizer is visible
        when automatically scrolling right */
        columnResizing.widths = _.initial(_.map(headColGroupRef.current.children, "clientWidth"));
        columnResizing.initialWidth = scrollingContainerRef.current.scrollWidth;
        columnResizing.movementBuffer = 0;

        setColumnGroup(columnGroup => ({
            ...columnGroup,
            widths: columnResizing.widths.map(px),
            spacerWidth: "100%",
            containerWidth: "fit-content",
            containerMinWidth: "0px"
        }));

        dragStart(x, y, pointerId, DragModes.Resize, { index });
    }, [dragStart, columnResizing]);

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
            dragUpdate?.();
        } else {
            dragUpdate?.(Point(e.movementX, e.movementY));
        }
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
        dragSelectStart
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

export default React.memo(ScrollingContainer);
