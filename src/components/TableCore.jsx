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
import styles from "../index.scss";
import { makeGetStateSlice } from '../selectors/namespaceSelectors';
import { makeGetPaginatedItems } from "../selectors/paginationSelectors";
import { bindActionCreators } from 'redux';
import InternalActions from '../models/internalActions';
import { tableOptions, defaultEvents } from '../utils/optionUtils';
import useWindowEvent from '../hooks/useWindowEvent';

function TableCore(props) {
    const {
        name,
        namespace,
        context,
        className,
        columns,
        emptyPlaceholder,
        loadingPlaceholder,
        errorPlaceholder,
        onItemsOpen,
        onColumnResizeEnd,
        onKeyDown,

        //Redux state
        items,
        error,
        isLoading,
        selectedValues,
        columnWidth,
        activeValue,
        columnOrder,
        dispatch
    } = props;

    const bodyContainer = useRef();
    const headContainer = useRef();

    const isTouching = useRef(false);

    const options = useMemo(() =>
        tableOptions[namespace], [namespace]);

    const values = useMemo(() =>
        _.map(items, options.valueProperty),
        [items, options]);

    const actions = useMemo(() => {
        const actions = new InternalActions(namespace);
        return bindActionCreators(actions, dispatch);
    }, [namespace, dispatch]);

    //#region Reducer updater

    //Register event handlers
    for (let event in defaultEvents) {
        const handler = props[event];
        useEffect(() => {
            options[event] = handler;
        }, [handler, options]);
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
                actions.setRowSelected(value, intersects);
        }

        //Set rectangle in state
        setSelRect(rect);
    }, [selOrigin, values, selectedValues, lastMousePos, actions]);

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

    const raiseItemsOpen = useCallback(enterKey => {
        if (selectedValues.length === 0) return;
        onItemsOpen(selectedValues, enterKey);
    }, [selectedValues, onItemsOpen]);

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

    //#region Event Handlers
    const handleMouseDown = e => {
        if (e.button !== 0) return;

        if (e.currentTarget === e.target && !e.ctrlKey)
            actions.clearSelection();

        dragStart([e.clientX, e.clientY]);
    };

    const handleContextMenu = e => {
        if (isTouching.current)
            dragStart([e.clientX, e.clientY]);

        if (e.currentTarget !== e.target) return;
        actions.contextMenu(null, e.ctrlKey);
    };

    const handleKeyDown = e => {
        switch (e.keyCode) {
            case 65: //A
                if (e.ctrlKey && options.multiSelect)
                    actions.selectAll();
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
            actions,
            options,
            columns: parsedColumns
        }

        const tableWidth = `${_.sum(columnWidth)}%`;
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
                    <Head {...commonParams} onResizeEnd={onColumnResizeEnd} />
                </table>
            </div>
            {isEmpty ?
                //Empty placeholder
                <div className={styles.placeholder}
                     tabIndex="0"
                     onContextMenu={() => actions.contextMenu(null)}
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
            placeholder = errorPlaceholder;
        else if (isLoading) //Loading
            placeholder = loadingPlaceholder;
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
    const getSlice = makeGetStateSlice();
    const getItems = makeGetPaginatedItems();

    return (root, props) => {
        const namespace = props.namespace || props.name;
        const slice = getSlice(root, namespace);
        const pick = _.pick(slice,
            "columnWidth",
            "columnOrder",
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
    namespace: PropTypes.string,
    context: PropTypes.any,
    className: PropTypes.string,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onColumnResizeEnd: PropTypes.func,
    onKeyDown: PropTypes.func,
    emptyPlaceholder: PropTypes.node,
    loadingPlaceholder: PropTypes.node,
    errorPlaceholder: PropTypes.node
};

TableCore.defaultProps = {
    onItemsOpen: () => { },
    onColumnResizeEnd: () => { },
    onKeyDown: () => { },
    ...defaultEvents
};
