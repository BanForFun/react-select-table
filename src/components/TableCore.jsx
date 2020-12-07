import styles from "../index.scss";

import React, {Fragment, useState, useEffect, useCallback, useRef, useMemo, useContext} from 'react';
import _ from "lodash";
import TableHead from "./TableHead";
import TableBody from "./TableBody";
import ColumnResizer from "./ColumnResizer";
import PropTypes from "prop-types";
import {connect, ReactReduxContext} from 'react-redux';
import Rect from '../models/rect';
import {bindActionCreators} from 'redux';
import {tableOptions, defaultEvents} from '../utils/optionUtils';
import useWindowEvent from '../hooks/useWindowEvent';
import {matchModifiers} from "../utils/eventUtils";
import {clampOffset} from "../utils/mathUtils";
import DefaultError from "./TableError";

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
        options,

        //Redux state
        tableItems: items,
        rowCount,
        topIndex,
        error,
        isLoading,
        selection,
        activeIndex,
        pivotIndex,
        dispatch
    } = props;

    const bodyContainerRef = useRef();
    const tableBodyRef = useRef();

    const isTouching = useRef(false);

    const {utils} = options;
    const itemCount = items.length;

    const dispatchers = useMemo(() =>
        bindActionCreators(utils.actions, dispatch),
        [utils, dispatch]
    );

    for (let reduxEvent in defaultEvents) {
        const handler = props[reduxEvent];
        useEffect(() => {
            options.events[reduxEvent] = handler;
        }, [handler, options]);
    }

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

    const isItemSelected = useCallback(index =>
        selection.has(items[index][options.valueProperty]),
        [selection, items, options]
    );

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
        const originIndex = selOrigin.index;
        const belowItems = originIndex < 0;
        const searchStart = belowItems ? rowCount : originIndex;

        let setActive = belowItems ? null : originIndex + topIndex;
        const setPivot = (belowItems ? rowCount - 1 : originIndex) + topIndex;

        let index;
        const selectMap = {};

        function updateCurrent(select) {
            const itemIndex = topIndex + index;
            if (select !== isItemSelected(itemIndex))
                selectMap[itemIndex] = select;
            else if (select)
                setActive = itemIndex;
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
            dispatchers.setSelected(selectMap);

        if (pivotIndex !== setPivot && isItemSelected(setPivot))
            dispatchers.setPivot(setPivot);
    }, [
        selOrigin,
        rowCount,
        topIndex,
        activeIndex,
        pivotIndex,
        selection,
        dispatchers,
        scrollFactor,
        findRowIndex,
        isItemSelected
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
            onItemsOpen(utils.formatSelection(selection), byKeyboard);
        else
            dispatchers.select(activeIndex, e.ctrlKey, e.shiftKey);
    }, [
        selection, activeIndex,
        dispatchers, utils,
        onItemsOpen
    ]);

    const selectIndex = useCallback((e, index) => {
        if (matchModifiers(e, true))
            dispatchers.setActive(index);
        else
            dispatchers.select(index, e.ctrlKey, e.shiftKey);

        //Get elements
        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const row = tableBodyRef.current.children[index];
        if (!row) return;

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

        const index = activeIndex + offset;
        if (index < 0) return;
        if (index >= itemCount) return;

        selectIndex(e, index);
    }, [
        selectIndex,
        activeIndex, itemCount
    ]);

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
                selectIndex(e, itemCount - 1);
                break;
            default:
                raiseKeyDown(e);
                return;
        }

        e.preventDefault();
    }, [
        dispatchers, options, itemCount,
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
            dispatchers,
            options,
            columns: parsedColumns
        }

        const containerStyle = {
            width: `${_.sum(columnWidths)}%`
        };

        const colGroup = <ColumnResizer name={name} columns={parsedColumns} />;

        let placeholder = null;
        if (isLoading)
            placeholder = loadingIndicator;
        else if (error)
            placeholder = <TableError error={error} />;
        else if (!rowCount)
            placeholder = emptyPlaceholder;

        if (placeholder) {
            const events = noItems ? {
                onContextMenu: () => dispatchers.contextMenu(null),
                onKeyDown: raiseKeyDown
            } : null

            return <div
                className={styles.placeholder}
                tabIndex="0"
                {...events}
            >{placeholder}</div>
        }

        return <Fragment>
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
        </Fragment>
    }

    return (
        <div className={styles.container}
             tabIndex="-1"
             onScroll={() => updateSelectRect()}
        >
            {renderTable()}
        </div>
    )
}

function mapState(root, props) {
    const {utils} = props.options;
    const state = utils.getStateSlice(root);

    const rows = utils.getPaginatedItems(state);
    const topIndex = utils.getTopIndex(state);

    return {
        ..._.pick(state,
            "selection",
            "isLoading",
            "activeIndex",
            "tableItems",
            "pivotIndex",
            "error"
        ),
        rowCount: rows.length,
        topIndex
    };
}

const ConnectedTable = connect(mapState)(TableCore);

export default function TableConnector(props) {
    const ns = props.namespace || props.name;
    const options = tableOptions[ns];

    if (!options.context)
        throw new Error("Please import ReactReduxContext from react-redux and pass it to the context option");

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
