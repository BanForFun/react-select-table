import React, { useState, useEffect, useRef, useCallback } from 'react';
import _ from "lodash";
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import PropTypes from "prop-types";
import { connect } from 'react-redux';
import {
    clearSelection,
    setRowSelected,
    selectAll,
    setActiveRow,
    selectRow,
    contextMenu,
    _setOption,
    _setColumnCount
} from '../store/table';
import Rect from '../models/rect';
import {
    ensurePosVisible,
    registerEventListeners,
    ensureRowVisible
} from '../utils/elementUtils';
import styles from "../index.scss";

function TableCore(props) {
    const {
        name,
        context,
        className,
        valueProperty,
        isMultiselect,
        columns,
        emptyPlaceholder,
        deselectOnContainerClick,

        //Events
        onItemsOpen,

        //Redux state
        items,
        selectedValues,
        columnWidth,
        activeValue,
        columnOrder,

        //Redux actions
        selectAll,
        setActiveRow,
        selectRow,
        contextMenu,
        clearSelection,
        setRowSelected,
        _setOption,
        _setColumnCount
    } = props;

    const values = _.map(items, valueProperty);

    //#region Drag selection

    //Create row refs
    const [rowRefs, setRowRefs] = useState({});
    useEffect(() => {
        const refs = _.map(values, React.createRef);
        const refObj = _.zipObject(values, refs);
        setRowRefs(refObj);
    }, [items, valueProperty]);

    //Drag start
    const [selOrigin, setSelOrigin] = useState(null);
    const dragStart = useCallback(e => {
        const dragEnabled = deselectOnContainerClick && isMultiselect;
        if (!dragEnabled || e.button !== 0) return;

        const { clientX: x, clientY: y } = e;
        const { scrollTop, scrollLeft } = bodyContainer.current;

        setLastMousePos([x, y]);
        // setRowBounds(getRowBounds());
        setSelOrigin([x + scrollLeft, y + scrollTop]);
    }, [deselectOnContainerClick, isMultiselect]);

    //Update row collision
    const updateRowCollision = useCallback(rect => {
        const { scrollTop, clientHeight } = bodyContainer.current;

        //Calculate top and bottom most visible points
        const topVisible = scrollTop;
        const bottomVisible = scrollTop + clientHeight;

        for (let value of values) {
            const { current } = rowRefs[value];

            //Calculate top and bottom position
            const top = current.offsetTop;
            const bottom = top + current.scrollHeight;

            //Skip if rows not visible
            if (bottom < topVisible) continue;
            if (top > bottomVisible) return;

            //Check for collision with selection rectangle
            const intersects = bottom > rect.top && top < rect.bottom;
            if (selectedValues.includes(value) !== intersects)
                setRowSelected(value, intersects);
        }
    }, [selectedValues, rowRefs]);

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
            const relativeBounds = new Rect(0, 0,
                container.scrollWidth, container.scrollHeight);
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
    const dragEnd = () => {
        setSelOrigin(null);
        setSelRect(null);
    }

    //Scroll
    const handleScroll = useCallback(() => {
        if (!selOrigin) return;
        const [x, y] = lastMousePos;
        updateSelectRect(x, y);
    }, [selOrigin, lastMousePos, updateSelectRect]);

    //Register mouse move and up events
    useEffect(() => {
        const cleanup = registerEventListeners(window, {
            "mousemove": dragMove,
            "mouseup": dragEnd
        });

        return cleanup;
    }, [dragMove]);

    //Rendering
    const renderSelectionRect = () => {
        if (!selRect) return null;
        const { left, top, width, height } = selRect;
        const style = {
            position: "absolute",
            left, top, width, height
        };

        return <div className={styles.selection} style={style} />
    }

    //#endregion

    //#region Body container overflow detection
    const [scrollBarWidth, setScrollBarWidth] = useState(0);
    const bodyContainer = useRef();

    useEffect(() => {
        const handleResize = () => {
            const container = bodyContainer.current;
            setScrollBarWidth(container.offsetWidth - container.clientWidth);
        }

        const observer = new ResizeObserver(handleResize);
        observer.observe(bodyContainer.current.firstElementChild);

        return observer.disconnect;
    }, []);
    //#endregion

    //#region Reducer updater

    //Set reducer options
    const options = _.pick(props, ...Object.keys(defaultReducerOptions));
    for (let name in options) {
        const value = options[name];
        useEffect(() => { _setOption(name, value) }, [value]);
    }

    //Set column count
    useEffect(() => { _setColumnCount(columns.length) }, [columns]);

    //#endregion

    //onItemOpen event
    const raiseItemOpen = enterKey => {
        if (selectedValues.length === 0) return;
        onItemsOpen(selectedValues, enterKey);
    }

    const selectFromKeyboard = useCallback((e, value) => {
        const onlyCtrl = e.ctrlKey && !e.shiftKey;
        if (onlyCtrl) setActiveRow(value);
        else selectRow(value, e.ctrlKey, e.shiftKey);

        ensureRowVisible(rowRefs[value].current, bodyContainer.current);
    }, [rowRefs]);

    //Handle up/down arrows
    const selectAtOffset = useCallback((e, offset) => {
        const activeIndex = values.indexOf(activeValue);
        if (activeIndex < 0) return;

        const offsetIndex = activeIndex + offset;
        if (!_.inRange(offsetIndex, 0, values.length)) return;

        const offsetValue = values[offsetIndex];
        selectFromKeyboard(e, offsetValue);
    }, [selectFromKeyboard, activeValue]);

    //Deselect rows
    const deselectRows = e => {
        if (e.currentTarget !== e.target ||
            e.ctrlKey || e.button !== 0) return;

        clearSelection();
    }

    //#region Event Handlers
    const handleMouseDown = useCallback(e => {
        deselectRows(e);
        dragStart(e);
    }, [dragStart])

    const handleDoubleClick = () => {
        raiseItemOpen(false);
    }

    const handleContextMenu = e => {
        contextMenu(null, e.ctrlKey);
    }

    const handleKeyDown = useCallback(e => {
        let preventDefault = true;

        switch (e.keyCode) {
            case 65: //A
                if (e.ctrlKey) selectAll();
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
                selectFromKeyboard(e, values[0]);
                break;
            case 35: //End
                selectFromKeyboard(e, _.last(values));
                break;
            default:
                preventDefault = false;
                break;
        }

        if (preventDefault) e.preventDefault();
    }, [selectFromKeyboard, selectAtOffset]);
    //#endregion

    //Column ordering and fitlering
    let orderedColumns = columns;
    if (columnOrder) {
        const ordered = _.sortBy(columns, c => columnOrder.indexOf(c.path));
        //Columns not included in the columnOrder list will have an index of -1
        //and be at the start of the ordered list
        orderedColumns = _.takeRight(ordered, columnOrder.length);
    }

    //Column parsing
    const parsedColumns = orderedColumns.map((col, index) => {
        const props = {
            width: `${columnWidth[index]}%`,
            id: col.key || col.path
        };

        return { ...col, props };
    });

    const commonParams = {
        name,
        context,
        columns: parsedColumns
    }

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
                onScroll={handleScroll}>
                <div className={styles.tableContainer} tabIndex="0"
                    onKeyDown={handleKeyDown}
                    onDoubleClick={handleDoubleClick}
                    onContextMenu={handleContextMenu}
                    onMouseDown={handleMouseDown}>
                    {renderSelectionRect()}
                    <table className={className}>
                        <ColumnResizer {...commonParams} />
                        <Body {...commonParams}
                            rowRefs={rowRefs}
                            valueProperty={valueProperty} />
                    </table>
                    {items.length === 0 && emptyPlaceholder}
                </div>
            </div>
        </div>
    )
}

function mapStateToProps(state) {
    const directMap = _.pick(state,
        "columnWidth",
        "columnOrder",
        "selectedValues",
        "activeValue"
    );

    return {
        ...directMap,
        items: state.tableItems
    }
}

export default connect(mapStateToProps, {
    clearSelection,
    setRowSelected,
    selectAll,
    selectRow,
    contextMenu,
    setActiveRow,
    _setOption,
    _setColumnCount
})(TableCore);

function defaultItemFilter(item, filter) {
    for (let key in filter) {
        if (item[key] !== filter[key])
            return false;
    }

    return true;
}

const defaultReducerOptions = {
    itemParser: item => item,
    itemFilter: defaultItemFilter,
    onContextMenu: () => { },
    onSelectionChange: () => { },
    minWidth: 3,
    isMultiselect: true,
    deselectOnContainerClick: true,
    valueProperty: null
};

const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    classNames: PropTypes.array,
    isHeader: PropTypes.bool
});

export const propTypes = {
    name: PropTypes.string.isRequired,
    valueProperty: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    emptyPlaceholder: PropTypes.element,
    items: PropTypes.array,
    filter: PropTypes.object,
    itemParser: PropTypes.func,
    itemFilter: PropTypes.func,
    minWidth: PropTypes.number,
    isMultiselect: PropTypes.bool,
    deselectOnContainerClick: PropTypes.bool,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func
}

export const defaultProps = {
    ...defaultReducerOptions,
    onItemsOpen: () => { }
}

TableCore.propTypes = propTypes;
TableCore.defaultProps = defaultProps;