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
    ensureRowVisible
} from '../utils/elementUtils';
import styles from "../index.scss";
import { makeGetStateSlice } from '../selectors/namespaceSelectors';
import { makeGetPaginatedItems } from "../selectors/paginationSelectors";
import { bindActionCreators } from 'redux';
import InternalActions from '../models/internalActions';
import {
    touchToMouseEvent,
    registerListeners
} from '../utils/eventUtils';
import { tableOptions } from '../utils/optionUtils';

function TableCore(props) {
    const {
        name,
        reducerName,
        context,
        className,
        columns,
        emptyPlaceholder,
        statePath,

        //Events
        onItemsOpen,

        //Redux state
        items,
        isLoading,
        selectedValues,
        columnWidth,
        activeValue,
        columnOrder,
        dispatch
    } = props;

    const bodyContainer = useRef();
    const headContainer = useRef();

    const tableName = useMemo(() =>
        reducerName || name, [reducerName, name]);

    const options = useMemo(() =>
        tableOptions[tableName], [tableName]);

    const values = useMemo(() =>
        _.map(items, options.valueProperty),
        [items, options]);

    const actions = useMemo(() => {
        const actions = new InternalActions(tableName);
        return bindActionCreators(actions, dispatch);
    }, [tableName, dispatch]);

    //#region Reducer updater

    //Register event handlers
    for (let name in defaultReducerEventHandlers) {
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
        rowRefs.current = rowRefs.current.slice(0, items.length);
    }, [items.length]);

    //Drag start
    const [selOrigin, setSelOrigin] = useState(null);
    const dragStart = useCallback(e => {
        //Return if listbox is enabled or multiselect is disabled
        const dragEnabled = !options.isListbox && options.isMultiselect;
        //Return if the mouse button pressed wasn't the primary one
        if (!dragEnabled || e.button !== 0) return;

        const { clientX: x, clientY: y } = e;
        const root = bodyContainer.current.offsetParent;

        setLastMousePos([x, y]);
        setSelOrigin([
            x + root.scrollLeft,
            y + root.scrollTop
        ]);
    }, [options]);

    //Update selection rectangle
    const [selRect, setSelRect] = useState(null);
    const [lastMousePos, setLastMousePos] = useState(null);
    const updateSelectRect = useCallback(mousePos => {
        if (!mousePos) mousePos = lastMousePos;

        const [mouseX, mouseY] = mousePos;
        const [originX, originY] = selOrigin;
        const body = bodyContainer.current;
        const root = body.offsetParent;

        //Calculate client rectangle
        const rect = Rect.fromPoints(
            mouseX + root.scrollLeft,
            mouseY + root.scrollTop,
            originX, originY
        );

        //Calculate visible client bounds
        const rootBounds = root.getBoundingClientRect();
        const clientBounds = Rect.fromPosSize(
            rootBounds.x, rootBounds.y,
            root.clientWidth, root.clientHeight
        );
        clientBounds.top += body.offsetTop;
        clientBounds.left += body.offsetLeft;

        //Calculate table bounds
        const scrollBounds = Rect.fromPosSize(
            clientBounds.x, clientBounds.y,
            body.scrollWidth, body.scrollHeight
        );

        //Make client rectangle be relative to container
        rect.limit(scrollBounds);
        rect.offsetBy(-rootBounds.x, -rootBounds.y);

        //Scroll if neccessary
        ensurePosVisible(root, mouseX, mouseY, clientBounds);

        //Calculate top and bottom most visible positions
        const topVisible = root.scrollTop + body.offsetTop;
        const bottomVisible = topVisible + clientBounds.height;

        //Modify selection based on collision
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const row = rowRefs.current[i];

            //Calculate top and bottom position
            const top = row.offsetTop + body.offsetTop;
            const bottom = top + row.clientHeight;

            //Skip if rows not visible
            if (bottom < topVisible) continue;
            if (top > bottomVisible) break;

            //Check for collision with the selection rectangle
            const intersects = bottom > rect.top && top < rect.bottom;
            if (selectedValues.includes(value) !== intersects)
                actions.setRowSelected(value, intersects);
        }

        //Set rectangle in state
        setSelRect(rect);
    }, [selOrigin, values, selectedValues, lastMousePos, actions]);

    const dragMove = useCallback(e => {
        if (!selOrigin) return;

        //Recalculate selection rectangle
        const newPos = [e.clientX, e.clientY];
        updateSelectRect(newPos);
        setLastMousePos(newPos);
    }, [selOrigin, updateSelectRect]);

    const dragEnd = useCallback(() => {
        if (!selOrigin) return;

        setSelOrigin(null);
        setSelRect(null);
    }, [selOrigin]);

    const handleScroll = useCallback(() => {
        if (!selOrigin) return;

        //Recalculate selection rectangle
        updateSelectRect();
    }, [selOrigin, updateSelectRect]);

    const touchMove = useCallback(e => {
        if (!selOrigin) return;

        touchToMouseEvent(e, true);
        dragMove(e);
    }, [dragMove, selOrigin]);

    const touchEnd = useCallback(e => {
        isTouching.current = false;
        if (!selOrigin) return;

        dragEnd();
        e.stopPropagation();
    }, [dragEnd, selOrigin])


    useEffect(() => {
        //Register mouse and touch events: move and up
        return registerListeners(window, {
            "mousemove": dragMove,
            "mouseup": dragEnd,
            "touchmove": touchMove,
            "touchend": touchEnd
        }, { passive: false });
    }, [dragMove, dragEnd, touchMove, touchEnd]);

    //#endregion

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

    const selectAtOffset = useCallback((e, offset) => {
        const activeIndex = values.indexOf(activeValue);
        if (activeIndex < 0) return;

        const offsetIndex = activeIndex + offset;
        if (!_.inRange(offsetIndex, 0, values.length)) return;

        selectFromKeyboard(e, offsetIndex);
    }, [selectFromKeyboard, activeValue, values]);

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
    }, []);

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
                if (e.ctrlKey && options.isMultiselect)
                    actions.selectAll();
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
        options,
        items
    ]);
    //#endregion

    const parsedColumns = useMemo(() => {
        //Order and filter columns
        const orderedColumns = columnOrder
            ? columnOrder.map(i => columns[i])
            : columns;

        //Add column metadata
        return orderedColumns.map((col, index) => ({
            ...col, meta: {
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
        options,
        columns: parsedColumns
    }

    const selectionRect = useMemo(() => {
        if (!selRect) return null;

        const style = _.pick(selRect, "left", "top", "width", "height");
        return <div className={styles.selection} style={style} />
    }, [selRect]);

    const widthStyle = useMemo(() => {
        const tableWidth = _.sum(columnWidth);
        return { width: `${tableWidth}%` };
    }, [columnWidth]);

    const colGroup = useMemo(() =>
        <ColumnResizer name={name} columns={parsedColumns} />,
        [name, parsedColumns]);

    return (
        <div className={styles.container} onScroll={handleScroll}>
            <div className={styles.headContainer}
                tabIndex="0"
                ref={headContainer}
                style={widthStyle}>
                <table className={className}>
                    {colGroup}
                    <Head {...commonParams} />
                </table>
            </div>
            <div className={styles.bodyContainer}
                tabIndex="0"
                ref={bodyContainer}
                style={widthStyle}
                onKeyDown={handleKeyDown}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onMouseDown={handleMouseDown}>
                {selectionRect}
                <table className={className} >
                    {colGroup}
                    <Body {...commonParams} rowRefs={rowRefs} />
                </table>
                {(items.length === 0 && !isLoading) && emptyPlaceholder}
            </div>
        </div >
    )
}

function makeMapState() {
    const getSlice = makeGetStateSlice();
    const getItems = makeGetPaginatedItems();

    return (root, props) => {
        const slice = getSlice(root, props);
        const pick = _.pick(slice,
            "columnWidth",
            "columnOrder",
            "selectedValues",
            "activeValue",
            "isLoading",
            "tableItems"
        );

        return {
            ...pick,
            items: getItems(slice)
        }
    }
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

const defaultReducerEventHandlers = {
    onContextMenu: () => { },
    onSelectionChange: () => { },
}

TableCore.defaultProps = {
    ...defaultReducerEventHandlers,
    onItemsOpen: () => { }
};