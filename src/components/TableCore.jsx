import styles from "../index.scss";

import React, {Fragment, useState, useEffect, useCallback, useRef, useMemo, useContext} from 'react';
import _ from "lodash";
import TableHead from "./TableHead";
import TableBody from "./TableBody";
import ColumnResizer from "./ColumnResizer";
import PropTypes from "prop-types";
import {connect, ReactReduxContext} from 'react-redux';
import Rect from '../models/rect';
import {makeGetPageCount, makeGetPaginatedItems} from "../selectors/paginationSelectors";
import {bindActionCreators} from 'redux';
import Actions from '../models/actions';
import {tableOptions, defaultEvents, formatSelection} from '../utils/optionUtils';
import useWindowEvent from '../hooks/useWindowEvent';
import {getTableSlice} from '../utils/reduxUtils';
import {matchModifiers} from "../utils/eventUtils";
import {clampOffset} from "../utils/mathUtils";
import DefaultError from "./TableError";
import DefaultPagination from "./TablePagination";

function TableCore(props) {
    const {
        name,
        ns,
        className,
        columns,
        emptyPlaceholder,
        loadingIndicator,
        onItemsOpen,
        onColumnsResizeEnd,
        onKeyDown,
        initColumnWidths,
        scrollFactor,
        columnOrder: _columnOrder,
        Error: TableError,
        Pagination: TablePagination,
        options,

        //Redux state
        items,
        error,
        isLoading,
        selection,
        activeIndex,
        pivotIndex,
        currentPage,
        pageCount,
        dispatch
    } = props;

    const bodyContainerRef = useRef();
    const tableBodyRef = useRef();

    const isTouching = useRef(false);

    const values = useMemo(() =>
        _.map(items, options.valueProperty),
        [items, options]
    );

    const dispatchers = useMemo(() =>
        bindActionCreators(new Actions(ns), dispatch),
        [ns, dispatch]
    );

    //#region Columns

    const columnOrder = useMemo(() =>
        _columnOrder || _.range(columns.length),
        [_columnOrder, columns]
    )

    const [_columnWidths, setColumnWidths] = useState(initColumnWidths);

    const columnWidths = useMemo(() => {
        const count = columnOrder.length;

        if (count === _columnWidths.length)
            return _columnWidths;

        return _.times(count, _.constant(100 / count))
    }, [_columnWidths, columnOrder.length])

    const parsedColumns = useMemo(() =>
        columnOrder.map((index, order) => {
            const column = columns[index];

            return {
                ...column,
                _width: `${columnWidths[order]}%`,
                _id: column.key || column.path
            }
        }),
        [columnOrder, columnWidths, columns]
    );

    //#endregion

    //#region Reducer updates

    //Register event handlers
    for (let event in defaultEvents) {
        const handler = props[event];
        useEffect(() => {
            options[event] = handler;
        }, [handler, options]);
    }

    //#endregion

    const findRowIndex = useCallback(target => {
        const headerHeight = bodyContainerRef.current.offsetTop;
        const rows = tableBodyRef.current.children;

        const getValue = index => rows[index].offsetTop + headerHeight;

        let start = 0;
        let end = rows.length - 1;

        //Binary search
        while (start <= end) {
            const middle = Math.floor((start + end) / 2);
            const value = getValue(middle);

            if (value < target)
                start = middle + 1;
            else if (value > target)
                end = middle - 1;
            else
                return middle;
        }

        return start - 1;
    }, []);

    //#region Drag selection

    //Drag start
    const [selOrigin, setSelOrigin] = useState(null);
    const dragStart = useCallback((mousePos, belowItems) => {
        //Return if listBox is enabled or multiSelect is disabled
        if (options.listBox || !options.multiSelect) return;

        const [mouseX, mouseY] = mousePos;
        const root = bodyContainerRef.current.offsetParent;
        const bounds = root.getBoundingClientRect();

        const relMouseX = mouseX + root.scrollLeft - bounds.x;
        const relMouseY = mouseY + root.scrollTop - bounds.y;

        lastMousePos.current = mousePos;
        lastRelMouseY.current = relMouseY;
        setSelOrigin({
            x: relMouseX,
            y: relMouseY,
            index: belowItems ? -1 : findRowIndex(relMouseY)
        });
    }, [options, findRowIndex]);

    const dragEnd = useCallback(() => {
        if (!selOrigin) return;

        setSelOrigin(null);
        setSelRect(null);

        isTouching.current = false;
    }, [selOrigin]);

    //Update selection rectangle
    const [selRect, setSelRect] = useState(null);
    const lastMousePos = useRef();
    const lastRelMouseY = useRef();

    const updateSelectRect = useCallback((mousePos = null) => {
        if (!selOrigin) return;

        //Load mouse position
        if (!mousePos)
            mousePos = lastMousePos.current;
        else
            lastMousePos.current = mousePos;

        //Deconstruct positions
        const [mouseX, mouseY] = mousePos;

        //Get body values
        const {
            offsetParent: rootEl,
            offsetTop: headerHeight,
            offsetLeft: headerWidth,
            scrollWidth,
            scrollHeight
        } = bodyContainerRef.current;

        //Get scroll position
        const {
            scrollLeft: scrollX,
            scrollTop: scrollY
        } = rootEl;

        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBodyRef.current;

        //Calculate visible container bounds
        const bounds = rootEl.getBoundingClientRect();
        const visibleBounds = new Rect(
            bounds.left + headerWidth,
            bounds.top + headerHeight,
            bounds.right,
            bounds.bottom
        );

        //Scroll horizontally
        const scrollRight = mouseX - visibleBounds.right;
        const scrollLeft = visibleBounds.left - mouseX;

        if (scrollRight > 0)
            rootEl.scrollLeft += scrollRight * scrollFactor;
        else if (scrollLeft > 0)
            rootEl.scrollLeft -= scrollLeft * scrollFactor;

        //Scroll vertically
        const scrollDown = mouseY - visibleBounds.bottom;
        const scrollUp = visibleBounds.top - mouseY;

        if (scrollDown > 0)
            rootEl.scrollTop += scrollDown * scrollFactor;
        else if (scrollUp > 0)
            rootEl.scrollTop -= scrollUp * scrollFactor;

        //Calculate relative mouse position
        const relMouseX = clampOffset(
            mouseX + scrollX - bounds.x,
            headerWidth, scrollWidth
        );

        const relMouseY = clampOffset(
            mouseY + scrollY - bounds.y,
            headerHeight, scrollHeight
        );

        //Define selection check area
        const maxMouseY = Math.max(relMouseY, lastRelMouseY.current);
        const minMouseY = Math.min(relMouseY, lastRelMouseY.current);
        lastRelMouseY.current = relMouseY;

        //Calculate selection rectangle
        setSelRect(Rect.fromPoints(relMouseX, relMouseY, selOrigin.x, selOrigin.y));

        //Set up search
        const rowCount = values.length;
        const originIndex = selOrigin.index;
        const belowItems = originIndex < 0;
        let setActive = belowItems ? null : originIndex;
        const searchStart = belowItems ? rowCount : originIndex;
        const setPivot = belowItems ? rowCount - 1 : originIndex;

        let index;
        const selectMap = {};

        function updateCurrent(select) {
            if (select !== selection.has(values[index]))
                selectMap[index] = select;
            else if (select)
                setActive = index;
        }

        function getCurrentTop() {
            const baseHeight = index >= rowCount
                ? tableHeight
                : rows[index].offsetTop

            return baseHeight + headerHeight;
        }

        //Search down
        index = searchStart + 1;
        while (index < rowCount) {
            const top = getCurrentTop();
            if (top > maxMouseY) break;

            updateCurrent(top < relMouseY);
            index++;
        }

        //Search up
        index = searchStart;
        while (index > 0) {
            const top = getCurrentTop();
            if (top < minMouseY) break;

            index--;
            updateCurrent(top > relMouseY);
        }

        if (setActive !== null && setActive !== activeIndex)
            selectMap[setActive] = true;

        if (!_.isEmpty(selectMap))
            dispatchers.setRowsSelected(selectMap);

        if (pivotIndex !== setPivot && selection.has(values[setPivot]))
            dispatchers.setPivotIndex(setPivot);
    }, [
        selOrigin,
        values,
        activeIndex,
        pivotIndex,
        selection,
        dispatchers,
        scrollFactor,
        findRowIndex
    ]);

    useWindowEvent("mousemove", useCallback(e => {
        updateSelectRect([e.clientX, e.clientY])
    }, [updateSelectRect]));

    useWindowEvent("mouseup", dragEnd);

    useWindowEvent("touchmove", useCallback(e => {
        if (selOrigin) e.preventDefault();

        const [touch] = e.touches;
        const pos = [touch.clientX, touch.clientY];
        updateSelectRect(pos);
    }, [updateSelectRect, selOrigin]));

    useWindowEvent("touchend", dragEnd);
    //#endregion

    //#region Selection utils

    const openItems = useCallback((e, byKeyboard) => {
        const openByKeyboard = matchModifiers(e) && selection.size;
        if (!byKeyboard || openByKeyboard)
            onItemsOpen(formatSelection(selection, ns), byKeyboard);
        else
            dispatchers.selectRow(activeIndex, e.ctrlKey, e.shiftKey);
    }, [
        selection,
        activeIndex,
        values,
        dispatchers,
        ns,
        onItemsOpen
    ]);

    const selectIndex = useCallback((e, index) => {
        if (matchModifiers(e, true))
            dispatchers.setActiveIndex(index);
        else
            dispatchers.selectRow(index, e.ctrlKey, e.shiftKey);

        //Get elements
        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const row = tableBodyRef.current.children[index];

        //Scroll up
        const scrollUp = row.offsetTop < root.scrollTop;
        if (scrollUp)
            root.scrollTop = row.offsetTop;

        //Scroll down
        const visibleHeight = root.offsetHeight - body.offsetTop;
        const rowBottom = row.offsetTop + row.offsetHeight;
        const scrollDown = rowBottom > (root.scrollTop + visibleHeight);
        if (scrollDown)
            root.scrollTop = rowBottom - visibleHeight;
    }, [dispatchers]);

    const selectOffset = useCallback((e, offset) => {
        if (activeIndex == null) return;

        const index = _.clamp(activeIndex + offset, 0, values.length - 1);
        selectIndex(e, index);
    }, [selectIndex, activeIndex, values]);

    const raiseKeyDown = useCallback(e => {
        onKeyDown(e, formatSelection(selection, ns));
    }, [selection, ns, onKeyDown])

    //#endregion

    //#region Event Handlers
    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        const belowItems = e.currentTarget === e.target;
        if (belowItems && !e.ctrlKey && !options.listBox)
            dispatchers.clearSelection();

        dragStart([e.clientX, e.clientY], belowItems);
    }, [dragStart, dispatchers, options]);

    const handleContextMenu = useCallback(e => {
        const belowItems = e.currentTarget === e.target;
        if (belowItems)
            dispatchers.contextMenu(null, e.ctrlKey);

        if (isTouching.current)
            dragStart([e.clientX, e.clientY], belowItems);
    }, [dragStart, dispatchers]);

    const handleKeyDown = useCallback(e => {
        switch (e.keyCode) {
            case 65: //A
                if (matchModifiers(e, true) && options.multiSelect)
                    dispatchers.selectAll();
                break;
            case 38: //Up
                selectOffset(e, -1);
                break;
            case 40: //Down
                selectOffset(e, 1);
                break;
            case 13: //Enter
                openItems(e, true);
                break;
            case 36: //Home
                selectIndex(e, 0);
                break;
            case 35: //End
                selectIndex(e, items.length - 1);
                break;
            default:
                raiseKeyDown(e);
                return;
        }

        e.preventDefault();
    }, [
        dispatchers, options, items,
        selectOffset, selectIndex, openItems, raiseKeyDown
    ]);
    //#endregion

    function renderSelectionBox() {
        if (!selRect) return null;

        const style = _.mapValues(
            _.pick(selRect, "left", "top", "width", "height"),
            n => `${n}px`
        );

        return <div className={styles.selection} style={style}/>
    }

    function renderTable() {
        const commonProps = {
            name,
            ns,
            dispatchers,
            options,
            columns: parsedColumns
        }

        const containerStyle = {
            width: `${_.sum(columnWidths)}%`
        };

        const colGroup = <ColumnResizer name={name} columns={parsedColumns} />;
        const isEmpty = items.length === 0;

        let placeholder = null;
        if (isLoading)
            placeholder = loadingIndicator;
        else if (error)
            placeholder = <TableError error={error} />;
        else if (isEmpty)
            placeholder = emptyPlaceholder;

        if (placeholder) {
            const events = isEmpty ? {
                onContextMenu: () => dispatchers.contextMenu(null),
                onKeyDown: raiseKeyDown
            } : null

            return <div
                className={styles.placeholder}
                tabIndex="0"
                {...events}
            >{placeholder}</div>
        }

        return <>
            <div tabIndex="-1"
                 style={containerStyle}
                 className={styles.headContainer}
            >
                <table className={className}>
                    {colGroup}
                    <TableHead {...commonProps}
                               onResizeEnd={onColumnsResizeEnd}
                               columnWidths={columnWidths}
                               setColumnWidths={setColumnWidths}
                    />
                </table>
            </div>
            <div className={styles.bodyContainer}
                 tabIndex="0"
                 style={containerStyle}
                 ref={bodyContainerRef}
                 onKeyDown={handleKeyDown}
                 onDoubleClick={e => openItems(e, false)}
                 onContextMenu={handleContextMenu}
                 onTouchStart={() => isTouching.current = true}
                 onMouseDown={handleMouseDown}
            >
                {renderSelectionBox()}
                <table className={className}>
                    {colGroup}
                    <TableBody {...commonProps} tableBodyRef={tableBodyRef} />
                </table>
            </div>
        </>
    }

    return (
        <div className={styles.container}
             tabIndex="-1"
             onScroll={() => updateSelectRect()}
        >
            {renderTable()}
        </div>
    )
};

function makeMapState() {
    const getItems = makeGetPaginatedItems();
    const getPageCount = makeGetPageCount();

    return (root, props) => {
        const state = getTableSlice(root, props.ns);

        return {
            ..._.pick(state,
                "selection",
                "activeIndex",
                "pivotIndex",
                "isLoading",
                "currentPage",
                "error",
                "tableItems"
            ),
            items: getItems(state),
            pageCount: getPageCount(state)
        }
    }
}

const ConnectedTable = connect(makeMapState)(TableCore);

export default function TableConnector(props) {
    const ns = props.namespace || props.name;
    const options = tableOptions[ns];

    if (!options.context)
        throw new Error("Please pass the global context to the context option");

    const contextValue = useContext(options.context);

    return <ReactReduxContext.Provider value={contextValue}>
        <ConnectedTable {...props} ns={ns} options={options} />
    </ReactReduxContext.Provider>
}

export const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    isHeader: PropTypes.bool
});

TableConnector.propTypes = {
    Error: PropTypes.elementType,
    loadingIndicator: PropTypes.node,
    emptyPlaceholder: PropTypes.node,
    namespace: PropTypes.string,
    name: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    className: PropTypes.string,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    initColumnWidths: PropTypes.arrayOf(PropTypes.number),
    scrollFactor: PropTypes.number,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onColumnsResizeEnd: PropTypes.func,
    onKeyDown: PropTypes.func
};

TableConnector.defaultProps = {
    onItemsOpen: () => { },
    onColumnsResizeEnd: () => { },
    onKeyDown: () => { },
    renderError: msg => msg,
    initColumnWidths: [],
    scrollFactor: 0.2,
    Error: DefaultError,
    ...defaultEvents
};
