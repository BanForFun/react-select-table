import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import _ from "lodash";
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import PropTypes from "prop-types";
import { connect } from 'react-redux';
import Rect from '../models/rect';
import {
    ensurePosVisible,
    registerEventListeners,
    ensureRowVisible
} from '../utils/elementUtils';
import styles from "../index.scss";
import { makeGetStateSlice } from '../selectors/namespaceSelector';
import { defaultEventHandlers } from '../store/table';
import { bindActionCreators } from 'redux';
import InternalActions from '../models/internalActions';
import { touchToMouseEvent } from '../utils/eventUtils';

function TableCore(props) {
    const {
        name,
        reducerName,
        context,
        className,
        valueProperty,
        isMultiselect,
        columns,
        emptyPlaceholder,
        isListbox,
        statePath,

        //Events
        onItemsOpen,

        //Redux state
        tableItems: items,
        isLoading,
        selectedValues,
        columnWidth,
        activeValue,
        columnOrder,
        dispatch
    } = props;

    const values = useMemo(() =>
        _.map(items, valueProperty),
        [items, valueProperty]);

    const actions = useMemo(() => {
        const tableName = reducerName || name;
        const actions = new InternalActions(tableName);
        return bindActionCreators(actions, dispatch);
    }, [name, reducerName, dispatch]);

    //#region Reducer updater

    //Register event handlers
    for (let name in defaultEventHandlers) {
        const handler = props[name];
        useEffect(() => {
            actions.setEventHandler(name, handler)
        }, [handler, actions]);
    };

    //Set column count
    useEffect(() => {
        if (columnOrder) return;
        actions.setColumnCount(columns.length)
    }, [columns.length, columnOrder, actions]);

    //#endregion

    //#region Drag selection

    //Create row refs
    const rowRefs = useRef([]);
    useEffect(() => {
        // const refs = Array.from({ length: items.length }, React.createRef);
        // setRowRefs(refs);
        rowRefs.current = rowRefs.current.slice(0, items.length);
    }, [items.length]);

    //Drag start
    const [selOrigin, setSelOrigin] = useState(null);
    const dragStart = useCallback(e => {
        const dragEnabled = !isListbox && isMultiselect;
        if (!dragEnabled || e.button !== 0) return;

        const { clientX: x, clientY: y } = e;
        const { scrollTop, scrollLeft } = bodyContainer.current;

        setLastMousePos([x, y]);
        setSelOrigin([x + scrollLeft, y + scrollTop]);
    }, [isListbox, isMultiselect]);

    //Update row collision
    const updateRowCollision = useCallback(rect => {
        const { scrollTop, clientHeight } = bodyContainer.current;

        //Calculate top and bottom most visible points
        const topVisible = scrollTop;
        const bottomVisible = scrollTop + clientHeight;

        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const rowEl = rowRefs.current[i];

            //Calculate top and bottom position
            const top = rowEl.offsetTop;
            const bottom = top + rowEl.scrollHeight;

            //Skip if rows not visible
            if (bottom < topVisible) continue;
            if (top > bottomVisible) return;

            //Check for collision with selection rectangle
            const intersects = bottom > rect.top && top < rect.bottom;
            if (selectedValues.includes(value) !== intersects)
                actions.setRowSelected(value, intersects);
        }
    }, [selectedValues, values, actions]);

    //Update selection rectangle
    const [selRect, setSelRect] = useState(null);
    const updateSelectRect = useCallback(
        (mouseX, mouseY) => {
            const [originX, originY] = selOrigin;
            const container = bodyContainer.current;

            //Calculate rectangle relative to viewport
            const { scrollLeft, scrollTop } = container;
            const relMouseX = mouseX + scrollLeft;
            const relMouseY = mouseY + scrollTop;
            const rect = Rect.fromPoints(relMouseX, relMouseY, originX, originY);

            //Calculate rectangle relative to table body
            const bounds = container.getBoundingClientRect();
            rect.offsetBy(-bounds.x, -bounds.y);

            //Restrict rectangle to table body bounds
            const tableBounds = getTableContainer().getBoundingClientRect();
            const relativeBounds = new Rect(0, 0,
                tableBounds.width, tableBounds.height);
            rect.limit(relativeBounds);

            //Scroll if neccessary
            ensurePosVisible(container, mouseX, mouseY);
            //Update collisions
            updateRowCollision(rect);
            //Set rectangle in state
            setSelRect(rect);
        }, [selOrigin, updateRowCollision]);

    //Drag move
    const [lastMousePos, setLastMousePos] = useState(null);
    const dragMove = useCallback(e => {
        if (!selOrigin) return;
        updateSelectRect(e.clientX, e.clientY);
        setLastMousePos([e.clientX, e.clientY]);
    }, [selOrigin, updateSelectRect]);

    //Drag end
    const dragEnd = useCallback(() => {
        setSelOrigin(null);
        setSelRect(null);
    }, []);

    //Scroll
    const handleScroll = useCallback(() => {
        if (!selOrigin) return;
        const [x, y] = lastMousePos;
        updateSelectRect(x, y);
    }, [selOrigin, lastMousePos, updateSelectRect]);

    const touchMove = useCallback(e => {
        if (!selOrigin) return;
        touchToMouseEvent(e);
        dragMove(e);

        e.stopPropagation();
        e.preventDefault();
    }, [dragMove, selOrigin]);

    const touchEnd = useCallback(e => {
        isTouching.current = false;
        dragEnd();

        e.stopPropagation();
    }, [dragEnd])

    //Register mouse move and up events
    useEffect(() => {
        const cleanup = registerEventListeners(window, {
            "mousemove": dragMove,
            "mouseup": dragEnd,
            "touchmove": touchMove,
            "touchend": touchEnd
        }, { passive: false });

        return cleanup;
    }, [dragMove, dragEnd, touchMove, touchEnd]);

    //#endregion

    //#region Body container overflow detection
    const [scrollBarWidth, setScrollBarWidth] = useState(0);
    const bodyContainer = useRef();

    const getTableContainer = useCallback(() =>
        bodyContainer.current.firstElementChild, []);

    useEffect(() => {
        const handleResize = () => {
            const ctr = bodyContainer.current;
            const vertical = ctr.offsetWidth - ctr.clientWidth;
            setScrollBarWidth(vertical);
        }

        const observer = new ResizeObserver(handleResize);
        observer.observe(getTableContainer());

        return () => observer.disconnect();
    }, []);
    //#endregion

    //onItemOpen event
    const raiseItemOpen = useCallback(enterKey => {
        if (selectedValues.length === 0) return;
        onItemsOpen(selectedValues, enterKey);
    }, [selectedValues])

    const selectFromKeyboard = useCallback((e, index) => {
        const value = values[index];

        const onlyCtrl = e.ctrlKey && !e.shiftKey;
        if (onlyCtrl) actions.setActiveRow(value);
        else actions.selectRow(value, e.ctrlKey, e.shiftKey);

        ensureRowVisible(rowRefs.current[index], bodyContainer.current);
    }, [values, actions]);

    //Handle up/down arrows
    const selectAtOffset = useCallback((e, offset) => {
        const activeIndex = values.indexOf(activeValue);
        if (activeIndex < 0) return;

        const offsetIndex = activeIndex + offset;
        if (!_.inRange(offsetIndex, 0, values.length)) return;

        selectFromKeyboard(e, offsetIndex);
    }, [selectFromKeyboard, activeValue, values]);

    //Deselect rows
    const deselectRows = useCallback(e => {
        if (e.currentTarget !== e.target ||
            e.ctrlKey || e.button !== 0) return;

        actions.clearSelection();
    }, [actions]);

    //#region Event Handlers
    const handleMouseDown = useCallback(e => {
        deselectRows(e);
        dragStart(e);
    }, [dragStart, deselectRows]);

    const isTouching = useRef(false);
    const handleTouchStart = useCallback(e => {
        isTouching.current = true;
        e.stopPropagation();
    }, [])

    const handleDoubleClick = useCallback(() => {
        raiseItemOpen(false);
    }, [raiseItemOpen]);

    const handleContextMenu = useCallback(e => {
        if (isTouching.current) dragStart(e);

        if (e.currentTarget !== e.target) return;
        actions.contextMenu(null, e.ctrlKey);
    }, [actions]);

    const handleKeyDown = useCallback(e => {
        let preventDefault = true;

        switch (e.keyCode) {
            case 65: //A
                if (e.ctrlKey) actions.selectAll();
                break;
            case 38: //Up
                selectAtOffset(e, -1);
                break;
            case 40: //Down
                selectAtOffset(e, 1);
                break;
            case 13: //Enter
                raiseItemOpen(true);
                break;
            case 36: //Home
                selectFromKeyboard(e, 0);
                break;
            case 35: //End
                selectFromKeyboard(e, items.length - 1);
                break;
            default:
                preventDefault = false;
                break;
        }

        if (preventDefault) e.preventDefault();
    }, [
        selectFromKeyboard,
        selectAtOffset,
        raiseItemOpen,
        actions,
        items,
    ]);
    //#endregion

    const parsedColumns = useMemo(() => {
        //Column ordering and fitlering
        const orderedColumns = columnOrder
            ? columnOrder.map(i => columns[i])
            : columns;

        //Column parsing
        return orderedColumns.map((col, index) => ({
            ...col, props: {
                width: `${columnWidth[index]}%`,
                id: col.key || col.path
            }
        }));
    }, [columnOrder, columnWidth, columns]);

    const commonParams = {
        name,
        context,
        statePath,
        actions,
        columns: parsedColumns
    }

    const showPlaceholder = items.length === 0 && !isLoading;

    //Selection rectangle
    const selectionRect = useMemo(() => {
        if (!selRect) return null;
        const { left, top, width, height } = selRect;
        const style = {
            position: "absolute",
            left, top, width, height
        };

        return <div className={styles.selection} style={style} />
    }, [selRect]);

    return (
        <div className={styles.container}>
            <div className={styles.headContainer}>
                <table className={className}>
                    <Head {...commonParams}
                        scrollBarWidth={scrollBarWidth} />
                </table>
            </div>
            <div className={styles.bodyContainer}
                ref={bodyContainer}
                // style={{ touchAction: selOrigin ? "none" : "auto" }}
                onScroll={handleScroll}>
                <div className={styles.tableContainer} tabIndex="0"
                    onKeyDown={handleKeyDown}
                    onDoubleClick={handleDoubleClick}
                    onContextMenu={handleContextMenu}
                    onTouchStart={handleTouchStart}
                    onMouseDown={handleMouseDown}>
                    {selectionRect}
                    <table className={className}>
                        <ColumnResizer {...commonParams} />
                        <Body {...commonParams} rowRefs={rowRefs} />
                    </table>
                    {showPlaceholder && emptyPlaceholder}
                </div>
            </div>
        </div>
    )
}

function makeMapState() {
    const getSlice = makeGetStateSlice();

    return (root, props) => _.pick(
        getSlice(root, props),
        "columnWidth",
        "columnOrder",
        "selectedValues",
        "activeValue",
        "isLoading",
        "valueProperty",
        "isMultiselect",
        "isListbox",
        "tableItems"
    );
}

export default connect(makeMapState)(TableCore);

const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    isHeader: PropTypes.bool
});

TableCore.propTypes = {
    name: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    reducerName: PropTypes.string,
    statePath: PropTypes.string,
    context: PropTypes.any,
    className: PropTypes.string,
    emptyPlaceholder: PropTypes.element,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func
};

TableCore.defaultProps = {
    ...defaultEventHandlers,
    onItemsOpen: () => { }
};