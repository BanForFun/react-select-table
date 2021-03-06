import styles from "../index.scss";

import React, {Fragment, useState, useEffect, useCallback, useRef, useMemo} from 'react';
import _ from "lodash";
import TableHead from "./Head";
import TableBody from "./Body";
import ColumnResizer from "./ColumnResizer";
import PropTypes from "prop-types";
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {tableOptions, defaultEvents} from '../utils/optionUtils';
import useWindowEvent from '../hooks/useWindowEvent';
import {matchModifiers} from "../utils/eventUtils";
import {sortTuple} from "../utils/mathUtils";
import DefaultError from "./DefaultError";
import DefaultPagination from "./DefaultPagination";

function TableCore(props) {
    const {
        name,
        options,
        className,
        columns,
        emptyPlaceholder,
        loadingIndicator,
        onItemsOpen,
        onColumnsResizeEnd,
        onKeyDown,
        initColumnWidths,
        scrollFactor,
        showSelectionRect,
        columnOrder: _columnOrder,
        Error: TableError,
        Pagination: TablePagination,

        //Redux state
        itemCount,
        rows,
        sortBy,
        pageIndex,
        pageCount,
        startIndex,
        error,
        isLoading,
        selection,
        selectionArg,
        activeIndex,
        dispatch
    } = props;

    const bodyContainerRef = useRef();
    const tableBodyRef = useRef();

    const isTouching = useRef(false);

    const rowCount = rows.length;

    const { utils } = options;
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
            const col = columns[index];

            return {
                render: v => v,
                ...col,
                _width: `${columnWidths[order]}%`,
                _id: col.key || col.path
            }
        }),
        [columnOrder, columnWidths, columns]
    );

    //#endregion

    const findRowIndex = useCallback(target => {
        const rows = tableBodyRef.current.children;

        let start = 0;
        let end = rows.length - 1;

        //Binary search
        while (start <= end) {
            const middle = Math.floor((start + end) / 2);
            const value = rows[middle].offsetTop;

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
        //Return if multiSelect is disabled
        if (!options.multiSelect) return;

        //Return if below items and multiSelect listBox
        if (belowItems && options.listBox) return;

        const [mouseX, mouseY] = mousePos;
        const {
            offsetParent: root,
            offsetTop: headerHeight,
            offsetLeft: headerWidth
        } = bodyContainerRef.current;
        const bounds = root.getBoundingClientRect();

        const relMouseX = mouseX + root.scrollLeft - bounds.x - headerWidth;
        const relMouseY = mouseY + root.scrollTop - bounds.y - headerHeight;

        const rowIndex = belowItems ? -1 : findRowIndex(relMouseY);
        const itemIndex = belowItems ? -1 : rowIndex + startIndex;

        dragSelection.current = { [itemIndex]: true };
        lastMousePos.current = mousePos;
        lastRelMouseY.current = relMouseY;
        setSelOrigin({
            x: relMouseX,
            y: relMouseY,
            index: rowIndex
        });
    }, [ options, findRowIndex, startIndex ]);

    const lastRelMouseY = useRef();
    const dragSelection = useRef({});
    const updateDragSelection = useCallback(relMouseY => {
        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBodyRef.current;

        const selected = dragSelection.current;

        //Define selection check area
        const [minMouseY, maxMouseY] = sortTuple(relMouseY, lastRelMouseY.current);
        lastRelMouseY.current = relMouseY;

        //Set up search
        const oRowIndex = selOrigin.index;
        const belowItems = oRowIndex < 0;
        const oItemIndex = oRowIndex + startIndex;

        let rowIndex;
        let setActive = belowItems ? null : oItemIndex;
        const selectMap = {};

        const updateCurrent = select => {
            const itemIndex = startIndex + rowIndex;

            if (select !== selected[itemIndex])
                selectMap[itemIndex] = select;

            if (select)
                setActive = itemIndex;
        }

        const getCurrentTop = () =>
            rowIndex >= rowCount ? tableHeight : rows[rowIndex].offsetTop;

        const searchStart = belowItems ? rowCount : oRowIndex;

        //Search up
        rowIndex = searchStart;
        while (rowIndex > 0) {
            const top = getCurrentTop();
            if (top < minMouseY) break;

            rowIndex--;
            updateCurrent(top >= relMouseY);
        }

        //Search down
        rowIndex = searchStart + 1;
        while (rowIndex < rowCount) {
            const top = getCurrentTop();
            if (top > maxMouseY) break;

            updateCurrent(top <= relMouseY);
            rowIndex++;
        }

        if (_.isEmpty(selectMap)) return;

        //Set pivot row
        const lastItemIndex = startIndex + rowCount - 1;
        const setPivot = belowItems
            //If origin is below rows, set the pivot to the last row ONLY if it is selected
            ? (selectMap[lastItemIndex] ? lastItemIndex : null)
            //Else, set the pivot to the origin row
            : oItemIndex;

        //Modify selection
        Object.assign(selected, selectMap);
        dispatchers.setSelected(selectMap, setActive, setPivot);
    }, [
        selOrigin,
        rowCount,
        startIndex,
        dispatchers
    ]);

    //Update selection rectangle
    const [selRect, setSelRect] = useState(null);
    const lastMousePos = useRef();

    const updateSelectionRect = useCallback((mousePos = null) => {
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

        //Get container bounds
        const bounds = rootEl.getBoundingClientRect();

        //Scroll horizontally
        const scrollRight = mouseX - bounds.right;
        const scrollLeft = bounds.left + headerWidth - mouseX;

        if (scrollRight > 0)
            rootEl.scrollLeft += scrollRight * scrollFactor;
        else if (scrollLeft > 0)
            rootEl.scrollLeft -= scrollLeft * scrollFactor;

        //Scroll vertically
        const scrollDown = mouseY - bounds.bottom;
        const scrollUp = bounds.top + headerHeight - mouseY;

        if (scrollDown > 0)
            rootEl.scrollTop += scrollDown * scrollFactor;
        else if (scrollUp > 0)
            rootEl.scrollTop -= scrollUp * scrollFactor;

        //Calculate relative mouse position
        const relMouseX = _.clamp(scrollX - scrollLeft, 0, scrollWidth);
        const relMouseY = _.clamp(scrollY - scrollUp, 0, scrollHeight);

        //Update selection
        updateDragSelection(relMouseY);

        //Update rectangle
        if (!showSelectionRect) return;
        setSelRect({
            left: Math.min(relMouseX, selOrigin.x),
            top: Math.min(relMouseY, selOrigin.y),
            width: Math.abs(relMouseX - selOrigin.x),
            height: Math.abs(relMouseY - selOrigin.y)
        });
    }, [
        selOrigin,
        scrollFactor,
        updateDragSelection,
        showSelectionRect
    ]);

    const dragEnd = useCallback(() => {
        setSelOrigin(null);
        setSelRect(null);
        isTouching.current = false;
    }, []);

    useWindowEvent("mousemove", useCallback(e => {
        updateSelectionRect([e.clientX, e.clientY])
    }, [updateSelectionRect]));

    useWindowEvent("mouseup", dragEnd);

    useWindowEvent("touchmove", useCallback(e => {
        if (selOrigin) e.preventDefault();

        const [touch] = e.touches;
        const pos = [touch.clientX, touch.clientY];
        updateSelectionRect(pos);
    }, [updateSelectionRect, selOrigin]), false);

    useWindowEvent("touchend", dragEnd);
    //#endregion

    //#region Selection utils

    const openItems = useCallback((e, byKeyboard) => {
        const openByKeyboard = matchModifiers(e) && selection.size;
        if (!byKeyboard || openByKeyboard)
            onItemsOpen(selectionArg, byKeyboard);
        else
            dispatchers.select(activeIndex, e.ctrlKey, e.shiftKey);
    }, [
        selection, selectionArg, activeIndex,
        dispatchers, onItemsOpen
    ]);

    const scheduledScroll = useRef(null);
    const scrollToIndex = useCallback(itemIndex => {
        //Check row index
        const rowIndex = itemIndex - startIndex;
        if (!_.inRange(rowIndex, rowCount))
            return scheduledScroll.current = itemIndex;

        //Get elements
        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const row = tableBodyRef.current.children[rowIndex];

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
    }, [startIndex, rowCount]);

    useEffect(() => {
        const index = scheduledScroll.current;
        if (index === null) return;
        scheduledScroll.current = null;

        scrollToIndex(index);
    }, [scrollToIndex]);

    const selectIndex = useCallback((e, index) => {
        if (matchModifiers(e, true))
            dispatchers.setActive(index);
        else
            dispatchers.select(index, e.ctrlKey, e.shiftKey);

        scrollToIndex(index);
    }, [dispatchers, scrollToIndex]);

    const selectOffset = useCallback((e, offset) => {
        if (activeIndex == null) return;

        //Check item index
        const index = activeIndex + offset;
        if (!_.inRange(index, itemCount)) return;

        selectIndex(e, index);
    }, [selectIndex, activeIndex, itemCount]);

    const raiseKeyDown = useCallback(e => {
        onKeyDown(e, selectionArg);
    }, [selectionArg, onKeyDown])

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

        if (isTouching.current)
            dragStart([e.clientX, e.clientY], belowItems);
        else if (belowItems)
            dispatchers.contextMenu(null, e.ctrlKey);

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

    function renderSelectionRect() {
        if (!selRect) return null;

        const { offsetTop, offsetLeft } = bodyContainerRef.current;

        const style = {
            ...selRect,
            transform: `translate(${offsetLeft}px, ${offsetTop}px)`
        }

        return <div className={styles.selection} style={style}/>
    }

    function renderTable() {
        //Placeholder
        let placeholder;
        let events = null;

        if (isLoading)
            placeholder = loadingIndicator;
        else if (error)
            placeholder = <TableError error={error} />;
        else if (!rowCount) {
            placeholder = emptyPlaceholder;
            events = {
                onContextMenu: () => dispatchers.contextMenu(null),
                onKeyDown: raiseKeyDown
            };
        }

        if (placeholder !== undefined)
            return <div className={styles.placeholder}
                        tabIndex="0"
                        {...events}
            >{placeholder}</div>

        //Head and Body props
        const commonProps = {
            name,
            dispatchers,
            options,
            columns: parsedColumns
        }

        const bodyProps = {
            ...commonProps,
            selection,
            activeIndex,
            rows,
            startIndex,
            tableBodyRef
        }

        const headProps = {
            ...commonProps,
            onResizeEnd: onColumnsResizeEnd,
            columnWidths,
            setColumnWidths,
            sortBy
        }

        const paginationProps = {
            pageCount, pageIndex,
            goToPage: dispatchers.goToPage
        }

        const containerStyle = {
            width: `${_.sum(columnWidths)}%`
        };

        const colGroup = <ColumnResizer name={name} columns={parsedColumns} />;

        return <Fragment>
            <div className={styles.tableContainer}>
                <div className={styles.headContainer}
                     style={containerStyle}
                >
                    <table className={className}>
                        {colGroup}
                        <TableHead {...headProps} />
                    </table>
                </div>
                <div className={styles.bodyContainer}
                     style={containerStyle}
                     ref={bodyContainerRef}
                     onDoubleClick={e => openItems(e, false)}
                     onTouchStart={() => isTouching.current = true}
                     onContextMenu={handleContextMenu}
                     onMouseDown={handleMouseDown}
                >
                    {renderSelectionRect()}
                    <table className={className}>
                        {colGroup}
                        <TableBody {...bodyProps} />
                    </table>
                </div>
            </div>
            <div className={styles.pagination}>
                <TablePagination {...paginationProps} />
            </div>
        </Fragment>
    }

    return (
        <div className={styles.container}
             tabIndex="0"
             onKeyDown={handleKeyDown}
             onScroll={() => updateSelectionRect()}
        >
            {renderTable()}
        </div>
    )
}

function mapState(root, props) {
    const { utils } = props.options;
    const state = utils.getStateSlice(root);

    const pagination = utils.getPaginatedItems(state)

    return {
        ..._.pick(state,
            "selection",
            "isLoading",
            "activeIndex",
            "pageIndex",
            "error",
            "sortBy"
        ),
        itemCount: state.tableItems.length,
        startIndex: pagination.startIndex,
        rows: pagination.rows,
        pageCount: utils.getPageCount(state),
        selectionArg: utils.getSelectionArg(state)
    };
}

const ConnectedTable = connect(mapState)(TableCore);

export default function TableConnector({ name, namespace, ...rest }) {
    const options = tableOptions[namespace];
    const {context} = options;

    if (!context)
        throw new Error("Please import ReactReduxContext from react-redux and pass it to the context option");

    return <ConnectedTable
        {...rest}
        options={options}
        context={context}
        name={name ?? namespace}
    />
}

export const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    isHeader: PropTypes.bool
});

TableConnector.propTypes = {
    namespace: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    Error: PropTypes.elementType,
    Pagination: PropTypes.elementType,
    loadingIndicator: PropTypes.node,
    emptyPlaceholder: PropTypes.node,
    name: PropTypes.string,
    className: PropTypes.string,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    initColumnWidths: PropTypes.arrayOf(PropTypes.number),
    showSelectionRect: PropTypes.bool,
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
    Pagination: DefaultPagination,
    loadingIndicator: null,
    emptyPlaceholder: null,
    showSelectionRect: true,
    ...defaultEvents
};
