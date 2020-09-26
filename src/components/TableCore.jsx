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
        selectedValues,
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

    const actionDispatchers = useMemo(() =>
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

        if (!mousePos) mousePos = lastMousePos;
        else setLastMousePos(mousePos);

        const [mouseX, mouseY] = mousePos;
        const [originX, originY] = selOrigin;
        const body = bodyContainer.current;
        const root = body.offsetParent;

        //Calculate selection rectangle
        const rect = Rect.fromPoints(
            mouseX + root.scrollLeft,
            mouseY + root.scrollTop,
            originX, originY
        );

        //Calculate visible container bounds
        const rootBounds = root.getBoundingClientRect();
        const clientBounds = Rect.fromPosSize(
            rootBounds.x, rootBounds.y,
            root.clientWidth, root.clientHeight
        );

        //Remove header from container bounds
        clientBounds.top += body.offsetTop;
        clientBounds.left += body.offsetLeft;

        //Calculate table bounds
        const scrollBounds = Rect.fromPosSize(
            clientBounds.x, clientBounds.y,
            body.scrollWidth, body.scrollHeight
        );

        //Limit selection rectangle to table bounds
        rect.limit(scrollBounds);

        //Make selection rectangle be relative to container
        rect.offsetBy(-rootBounds.x, -rootBounds.y);

        //Scroll if necessary
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
                actionDispatchers.setRowSelected(value, intersects);
        }

        //Set rectangle in state
        setSelRect(rect);
    }, [selOrigin, values, selectedValues, lastMousePos, actionDispatchers]);

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

    const raiseItemsOpen = useCallback(enterKey => {
        if (selectedValues.length === 0) return;
        onItemsOpen(selectedValues, enterKey);
    }, [selectedValues, onItemsOpen]);

    const selectFromKeyboard = useCallback((e, index) => {
        const value = values[index];

        const onlyCtrl = e.ctrlKey && !e.shiftKey;
        if (onlyCtrl) actionDispatchers.setActiveRow(value);
        else actionDispatchers.selectRow(value, e.ctrlKey, e.shiftKey);

        ensureRowVisible(rowRefs.current[index], bodyContainer.current);
    }, [values, actionDispatchers]);

    const selectAtOffset = useCallback((e, offset) => {
        const activeIndex = values.indexOf(activeValue);
        if (activeIndex < 0) return;

        const offsetIndex = activeIndex + offset;
        if (!_.inRange(offsetIndex, 0, values.length)) return;

        selectFromKeyboard(e, offsetIndex);
    }, [selectFromKeyboard, activeValue, values]);

    //#endregion

    //#region Event Handlers
    const handleMouseDown = e => {
        if (e.button !== 0) return;

        if (e.currentTarget === e.target && !e.ctrlKey)
            actionDispatchers.clearSelection();

        dragStart([e.clientX, e.clientY]);
    };

    const handleContextMenu = e => {
        if (isTouching.current)
            dragStart([e.clientX, e.clientY]);

        if (e.currentTarget !== e.target) return;
        actionDispatchers.contextMenu(null, e.ctrlKey);
    };

    const handleKeyDown = e => {
        switch (e.keyCode) {
            case 65: //A
                if (e.ctrlKey && options.multiSelect)
                    actionDispatchers.selectAll();
                break;
            case 38: //Up
                selectAtOffset(e, -1);
                break;
            case 40: //Down
                selectAtOffset(e, 1);
                break;
            case 13: //Enter
                raiseItemsOpen(true);
                break;
            case 36: //Home
                selectFromKeyboard(e, 0);
                break;
            case 35: //End
                selectFromKeyboard(e, items.length - 1);
                break;
            default:
                return onKeyDown(e, selectedValues);
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
            dispatchActions: actionDispatchers,
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
                     onContextMenu={() => actionDispatchers.contextMenu(null)}
                     onKeyDown={e => onKeyDown(e, selectedValues)}
                >{emptyPlaceholder}</div> :

                //Table body
                <div className={styles.bodyContainer}
                     tabIndex="0"
                     ref={bodyContainer}
                     style={{
                         width: tableWidth
                     }}
                     onKeyDown={handleKeyDown}
                     onDoubleClick={() => raiseItemsOpen(false)}
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
            "selectedValues",
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
