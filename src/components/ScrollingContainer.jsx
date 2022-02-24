import _ from "lodash";
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ResizingContainer from "./ResizingContainer";
import {ColumnGroupContext} from "./ColumnGroup";
import {DragModes} from "../utils/tableUtils";

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

const cancelScrollListener = e => e.preventDefault();
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


    const [dragMode, setDragMode] = useState(null);

    const raiseColumnResizeEnd = hooks.useSelectorGetter(eventRaisers.columnResizeEnd);

    //Cancel scroll by touch when dragging
    useEffect(() => {
        const changeEventListener = dragMode ? window.addEventListener : window.removeEventListener;
        changeEventListener("touchmove", cancelScrollListener, cancelScrollOptions);
    }, [dragMode]);

    const rowValues = hooks.useSelector(s => s.rowValues);
    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);

    //Element refs
    const tableBodyRef = useRef();
    const selectionRectRef = useRef();
    const bodyContainerRef = useRef();
    const scrollingContainerRef = useRef();
    const headColGroupRef = useRef();
    const resizingContainerRef = useRef();


    //#region Dragging

    const drag = useRef({
        animationId: null,
        pointerPos: Point()
    }).current;

    const dragStart = useCallback((e, dragMode) => {
        drag.pointerPos = Point(e.clientX, e.clientY);

        setDragMode(dragMode);
        scrollingContainerRef.current.setPointerCapture(e.pointerId);
    }, [drag]);

    //#endregion

    //#region Selection

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

    const setDragSelectionOriginIndex = useCallback(index =>
        dragSelection.origin.index = index, [dragSelection]);

    const applyRectStyles = useCallback(styles => {
        Object.assign(selectionRectRef.current.style, styles);
    }, [selectionRectRef]);

    const dragSelectUpdate = useCallback((movement) => {
        if (movement) {
            const container = scrollingContainerRef.current;
            container.scrollLeft -= movement.x;
            container.scrollTop -= movement.y;
        }
    }, []);

    const dragSelectEnd = useCallback(() => {

    }, []);


    //#endregion

    //#region Column resizing

    const columnResizing = useRef({
        widths: [],
        waitForRender: false,
        initialWidth: 0,
        movementBuffer: 0
    }).current;

    useEffect(() => {
        columnResizing.waitForRender = false;
    }, [columnGroup, columnResizing]);

    const columnResizeStart = useCallback((e, index) => {
        if (!e.isPrimary) return;
        dragStart(e, { name: DragModes.Resize, index });

        columnResizing.waitForRender = true;
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
    }, [dragStart, columnResizing]);

    const columnResizeEnd = useCallback(() => {
        const container = scrollingContainerRef.current;
        const widths = columnResizing.widths.map(px => 100 * px / container.clientWidth);
        raiseColumnResizeEnd(widths);
        setColumnGroup(getColumnGroup(widths));

        bodyContainerRef.current.style.width = "100%";
    }, [columnResizing, setColumnGroup, getColumnGroup, raiseColumnResizeEnd]);

    const columnResizeAnimate = useCallback((changedWidths, scrollLeft) =>
    requestAnimationFrame(() => {
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

        if (drag.animationId == null)
            columnResizeEnd();
        else drag.animationId = null;
    }), [drag, columnResizeEnd, columnResizing]);

    const columnResizeUpdate = useCallback((movement = null) => {
        if (columnResizing.waitForRender) return;

        const container = scrollingContainerRef.current;

        const { index } = dragMode;
        const { widths } = columnResizing;
        const { constantWidth, minColumnWidth: minWidth } = options;

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

        cancelAnimationFrame(drag.animationId);
        drag.animationId = columnResizeAnimate(changedWidths, scrollLeft);
    }, [
        drag,
        columnResizing,
        columnResizeAnimate,
        columnResizeScrollFactor,
        options,
        dragMode
    ]);


    //#endregion

    //#region Routers

    const dragUpdate = useCallback((movement) => {
        const update = ({
            [DragModes.Resize]: columnResizeUpdate,
            [DragModes.Select]: dragSelectUpdate
        })[dragMode.name];

        return update?.(movement);
    }, [dragMode, columnResizeUpdate, dragSelectUpdate]);

    const dragEnd = useCallback(() => {
        const end = ({
            [DragModes.Resize]: columnResizeEnd,
            [DragModes.Select]: dragSelectEnd
        })[dragMode.name];

        return end?.();
    }, [dragMode, columnResizeEnd, dragSelectEnd]);

    //#endregion

    //#region Event handlers

    const handleContextMenu = useCallback(e => {

    }, []);

    const handleScroll = useCallback(e => {
        if (!dragMode) return;

        dragUpdate();
    }, [dragMode, dragUpdate]);

    const handlePointerMove = useCallback(e => {
        if (!dragMode) return;

        if (e.isPrimary) {
            drag.pointerPos = Point(e.clientX, e.clientY);
            dragUpdate();
        } else {
            dragUpdate(Point(e.movementX, e.movementY));
        }
    }, [dragMode, drag, dragUpdate]);

    const handlePointerStop = useCallback(e => {
        if (!dragMode) return;
        e.currentTarget.releasePointerCapture(e.pointerId);

        if (!e.isPrimary) return;
        setDragMode(null);

        if (drag.animationId == null)
            dragEnd();
        else drag.animationId = null;
    }, [dragMode, dragEnd, drag]);

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

        setDragSelectionOriginIndex,
        columnResizeStart
    });

    return <div
        className="rst-scrollingContainer"
        ref={scrollingContainerRef}
        data-dragmode={dragMode?.name}
        onContextMenu={handleContextMenu}
        onScroll={handleScroll}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerStop}
        onPointerUp={handlePointerStop}
    >
        <ColumnGroupContext.Provider value={columnGroup}>
            <ResizingContainer {...resizingProps} />
        </ColumnGroupContext.Provider>
    </div>
}

export default React.memo(ScrollingContainer);
