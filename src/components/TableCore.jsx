import styles from "../index.scss";

import React, { Fragment, useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { makeGetPaginatedItems } from "../selectors/paginationSelectors";
import { bindActionCreators } from 'redux';
import Actions from '../models/actions';
import { tableOptions, defaultEvents } from '../utils/optionUtils';
import useWindowEvent from '../hooks/useWindowEvent';
import {getTableSlice} from "../utils/reduxUtils";
import {matchModifiers} from "../utils/eventUtils";

const dragSelectionType = "drag";

function TableCore(props) {
    const {
        name,
        namespace,
        context,
        className,
        columns,
        emptyPlaceholder,
        loadingIndicator,
        renderError,
        onItemsOpen,
        onColumnsResizeEnd,
        onKeyDown,
        initColumnWidths,
        columnOrder: _columnOrder,

        //Redux state
        items,
        error,
        isLoading,
        selection,
        activeValue,
        dispatch
    } = props;

    const bodyContainer = useRef();
    const headContainer = useRef();

    const isTouching = useRef(false);

    const options = useMemo(() =>
        tableOptions[namespace], [namespace]);

    const values = useMemo(() =>
        _.map(items, options.valueProperty),
        [items, options]
    );

    const dispatchers = useMemo(() =>
        bindActionCreators(new Actions(namespace), dispatch),
        [namespace, dispatch]
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

    //#region Drag selection

    //Create row refs
    const rowRefs = useRef([]);
    useEffect(() => {
        rowRefs.current = rowRefs.current.slice(0, items.length);
    }, [items.length]);

    //Drag start
    const [selOrigin, setSelOrigin] = useState(null);
    const dragStart = useCallback(mousePos => {
        //Return if listBox is enabled or multiSelect is disabled
        const dragEnabled = !options.listBox && options.multiSelect;
        //Return if the mouse button pressed wasn't the primary one
        if (!dragEnabled) return;

        const [mouseX, mouseY] = mousePos;
        const root = bodyContainer.current.offsetParent;

        setLastMousePos(mousePos);
        setSelOrigin([
            mouseX + root.scrollLeft,
            mouseY + root.scrollTop
        ]);
    }, [options]);

    const dragEnd = useCallback(() => {
        if (!selOrigin) return;

        setSelOrigin(null);
        setSelRect(null);

        isTouching.current = false;
    }, [selOrigin]);

    //Update selection rectangle
    const [selRect, setSelRect] = useState(null);
    const [lastMousePos, setLastMousePos] = useState(null);
    const updateSelectRect = useCallback((mousePos = null) => {
        if (!selOrigin) return;

        //Cache last mouse position
        if (!mousePos)
            mousePos = lastMousePos;
        else
            setLastMousePos(mousePos);

        //Get elements
        const body = bodyContainer.current;
        const root = body.offsetParent;

        //Deconstruct positions
        const [mouseX, mouseY] = mousePos;
        const [originX, originY] = selOrigin;

        //Calculate selection rectangle
        const rect = Rect.fromPoints(
            mouseX + root.scrollLeft, mouseY + root.scrollTop,
            originX, originY
        );

        //Get header size
        const {
            offsetTop: headerHeight,
            offsetLeft: headerWidth
        } = body;

        //Calculate visible container bounds
        const rootBounds = root.getBoundingClientRect();
        const visibleBounds = new Rect(
            rootBounds.left + headerWidth,
            rootBounds.top + headerHeight,
            rootBounds.right,
            rootBounds.bottom
        );

        //Calculate table bounds
        const scrollBounds = Rect.fromPosSize(
            visibleBounds.x, visibleBounds.y,
            body.scrollWidth, body.scrollHeight
        );

        //Limit selection rectangle and make relative to table bounds.
        rect.limit(scrollBounds);
        rect.offsetBy(-rootBounds.x, -rootBounds.y);

        //Scroll if necessary
        ensurePosVisible(root, mouseX, mouseY, visibleBounds);

        //Calculate relative visible range
        const topVisible = root.scrollTop + headerHeight;
        const bottomVisible = topVisible + root.scrollHeight;

        //Calculate relative mouse Y position
        const relMouseY = mouseY - rootBounds.y + root.scrollTop;

        //Modify selection based on collision
        for (let i = 0; i < values.length; i++) {
            //Get element
            const row = rowRefs.current[i];

            //Calculate top
            const top = row.offsetTop + headerHeight;
            if (top > bottomVisible) break;

            //Calculate bottom
            const bottom = top + row.scrollHeight;
            if (bottom < topVisible) continue;

            //Check collision with rectangle and cursor
            const intersects = bottom > rect.top && top <= rect.bottom;
            const cursorInside = _.inRange(relMouseY, top, bottom);

            //Update selection
            const value = values[i];
            const isSelected = selection.get(value) === dragSelectionType;
            if (isSelected !== intersects || cursorInside)
                dispatchers.setRowSelected(value, intersects, dragSelectionType);
        }

        //Set rectangle in state
        setSelRect(rect);
    }, [selOrigin, values, selection, lastMousePos, dispatchers]);

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

    //#region Helpers

    const openItems = useCallback((e, enterKey) => {
        if (!enterKey || matchModifiers(e, false, false))
            onItemsOpen([...selection], enterKey);
        else
            dispatchers.selectRow(activeValue, e.ctrlKey, e.shiftKey)
    }, [selection, activeValue, dispatchers, onItemsOpen]);

    const selectIndex = useCallback((e, index) => {
        const value = values[index];

        if (matchModifiers(e, true, false))
            dispatchers.setActiveRow(value);
        else
            dispatchers.selectRow(value, e.ctrlKey, e.shiftKey);

        ensureRowVisible(rowRefs.current[index], bodyContainer.current);
    }, [values, dispatchers]);

    const selectOffset = useCallback((e, offset) => {
        if (activeValue == null) return;

        const index = _.clamp(
            values.indexOf(activeValue) + offset,
            0, values.length - 1
        );
        selectIndex(e, index);
    }, [selectIndex, activeValue, values]);

    const raiseKeyDown = useCallback(e => {
        onKeyDown(e, [...selection]);
    }, [selection, onKeyDown])

    //#endregion

    //#region Event Handlers
    const handleMouseDown = e => {
        if (e.button !== 0) return;

        if (
            e.currentTarget === e.target && //Click was below items
            !e.ctrlKey &&
            !options.listBox
        )
            dispatchers.clearSelection();

        dragStart([e.clientX, e.clientY]);
    };

    const handleContextMenu = e => {
        if (isTouching.current)
            dragStart([e.clientX, e.clientY]);

        if (e.currentTarget !== e.target) return;
        dispatchers.contextMenu(null, e.ctrlKey);
    };

    const handleKeyDown = e => {
        switch (e.keyCode) {
            case 65: //A
                if (e.ctrlKey && options.multiSelect)
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
                return raiseKeyDown(e);
        }

        e.preventDefault();
    };
    //#endregion

    const renderSelectionBox = () => {
        if (!selRect) return null;

        const posSize = _.mapValues(
            _.pick(selRect, "left", "top", "width", "height"),
            n => `${n}px`
        );
        return <div className={styles.selection} style={posSize}/>
    };

    const renderTable = () => {
        const commonParams = {
            name,
            namespace,
            context,
            dispatchers,
            options,
            columns: parsedColumns
        }

        const tableWidth = `${_.sum(columnWidths)}%`;
        const isEmpty = items.length === 0;

        const colGroup = <ColumnResizer name={name} columns={parsedColumns} />;

        return <Fragment>
            <div className={styles.headContainer}
                 tabIndex="0"
                 ref={headContainer}
                 style={{
                     width: tableWidth
                 }}>
                <table className={className}>
                    {colGroup}
                    <Head {...commonParams}
                          onResizeEnd={onColumnsResizeEnd}
                          columnWidths={columnWidths}
                          setColumnWidths={setColumnWidths}
                    />
                </table>
            </div>
            {isEmpty ?
                //Empty placeholder
                <div className={styles.placeholder}
                     tabIndex="0"
                     onContextMenu={() => dispatchers.contextMenu(null)}
                     onKeyDown={raiseKeyDown}
                >{emptyPlaceholder}</div> :

                //Table body
                <div className={styles.bodyContainer}
                     tabIndex="0"
                     ref={bodyContainer}
                     style={{
                         width: tableWidth
                     }}
                     onKeyDown={handleKeyDown}
                     onDoubleClick={e => openItems(e, false)}
                     onContextMenu={handleContextMenu}
                     onTouchStart={() => isTouching.current = true}
                     onMouseDown={handleMouseDown}
                >
                    {renderSelectionBox()}
                    <table className={className} >
                        {colGroup}
                        <Body {...commonParams} rowRefs={rowRefs} />
                    </table>
                </div>
            }

        </Fragment>
    }

    const renderContent = () => {
        let placeholder = null

        if (error) //Error
            placeholder = renderError(error);
        else if (isLoading) //Loading
            placeholder = loadingIndicator;
        else //All good
            return renderTable();

        return <div className={styles.placeholder}>
            {placeholder}
        </div>
    };

    return (
        <div className={styles.container}
             onScroll={() => updateSelectRect()}
        >{renderContent()}</div>
    )
}

function makeMapState() {
    const getItems = makeGetPaginatedItems();

    return (root, props) => {
        const namespace = props.namespace || props.name;
        const slice = getTableSlice(root, namespace);
        const pick = _.pick(slice,
            "selection",
            "activeValue",
            "isLoading",
            "error",
            "tableItems"
        );

        return {
            ...pick,
            namespace,
            items: getItems(slice)
        }
    }
}

export default connect(makeMapState)(TableCore);

export const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    isHeader: PropTypes.bool
});

TableCore.propTypes = {
    name: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    namespace: PropTypes.string,
    context: PropTypes.any,
    className: PropTypes.string,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onColumnsResizeEnd: PropTypes.func,
    onKeyDown: PropTypes.func,
    emptyPlaceholder: PropTypes.node,
    loadingIndicator: PropTypes.node,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    initColumnWidths: PropTypes.arrayOf(PropTypes.number),
    renderError: PropTypes.func
};

TableCore.defaultProps = {
    onItemsOpen: () => { },
    onColumnsResizeEnd: () => { },
    onKeyDown: () => { },
    renderError: msg => msg,
    initColumnWidths: [],
    ...defaultEvents
};
