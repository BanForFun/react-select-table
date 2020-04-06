import React, { useState, useEffect, useRef, useCallback } from 'react';
import _ from "lodash";
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import { connect } from 'react-redux';
import {
    clearSelection,
    setRowSelected,
    selectAll,
    setActiveRow,
    selectRow,
    _setOption
} from '../store/table';
import Rect from '../models/rect';
import {
    ensurePosVisible,
    registerEventListeners,
    ensureRowVisible
} from '../utils/elementUtils';
import { defaultOptions } from './Table';

function TableCore(props) {
    const {
        name,
        className,
        valueProperty,
        onDoubleClick,
        isMultiselect,

        //Redux state
        items,
        selectedValues,
        columnWidth,
        activeValue,
        columnOrder,

        //Redux actions
        selectAll,
        setActiveRow,
        selectItem,
        clearSelection,
        setRowSelected,
        _setOption
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

    // //Calculate row bounds
    // const [rowBounds, setRowBounds] = useState([]);
    // const getRowBounds = () => values.map(val => {
    //     const row = rowRefs[val].current;
    //     const rect = Rect.fromPosSize(
    //         row.offsetLeft, row.offsetTop,
    //         row.scrollWidth, row.scrollHeight
    //     );

    //     return { value: val, bounds: rect };
    // })

    //Drag start
    const [selOrigin, setSelOrigin] = useState(null);
    const dragStart = e => {
        if (!isMultiselect || e.button !== 0) return;
        const { clientX: x, clientY: y } = e;
        const { scrollTop, scrollLeft } = bodyContainer.current;

        setLastMousePos([x, y]);
        // setRowBounds(getRowBounds());
        setSelOrigin([x + scrollLeft, y + scrollTop]);
    }

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

        // //Find top and bottom most visible rows
        // const startIndex = _.findIndex(rowBounds, row =>
        //     row.bounds.bottom > topVisible);
        // const endIndex = _.findIndex(rowBounds, row =>
        //     row.bounds.top > bottomVisible, startIndex);

        // //Check visible rows for collision with rectangle
        // const visibleRowBounds = _.slice(rowBounds, startIndex, endIndex);
        // for (let row of visibleRowBounds) {
        //     const { bounds, value } = row;
        //     const intersects = rect.intersectsRectY(bounds);

        //     if (selectedValues.includes(value) !== intersects)
        //         setRowSelected(value, intersects);
        // }
    }, [setRowSelected, selectedValues]);

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
        // setRowBounds([]);
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

        return <div className="selection" style={{
            position: "absolute",
            left, top, width, height
        }} />
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

    //Set reducer options
    const options = _.pick(props, ...Object.keys(defaultOptions));
    for (let option in options) {
        const value = options[option];

        useEffect(() => {
            _setOption(option, value);
        }, [value]);
    }

    //#region Event Handlers
    const handleMouseDown = e => {
        deselectRows(e);
        dragStart(e);
    }

    const handleKeyDown = e => {
        switch (e.keyCode) {
            case 65: //A
                if (e.ctrlKey) selectAll();
                break;
            case 38: //Up
                handleKeyboardSelection(e, -1);
                break;
            case 40: //Down
                handleKeyboardSelection(e, 1);
                break;
        }
    }
    //#endregion

    //keyboard selection
    const handleKeyboardSelection = (e, offset) => {
        const activeIndex = values.indexOf(activeValue);
        if (activeIndex < 0) return;

        const offsetIndex = activeIndex + offset;
        if (!_.inRange(offsetIndex, 0, values.length)) return;

        const offsetValue = values[offsetIndex];
        const onlyCtrl = e.ctrlKey && !e.shiftKey;

        if (onlyCtrl) setActiveRow(offsetValue);
        else selectItem(offsetValue, e.ctrlKey, e.shiftKey);

        ensureRowVisible(rowRefs[offsetValue].current, bodyContainer.current);
        e.preventDefault();
    }

    //Deselect row
    const deselectRows = e => {
        if (e.currentTarget !== e.target || e.ctrlKey) return;
        clearSelection();
    }

    //Column ordering and fitlering
    let orderedColumns = props.columns;
    if (columnOrder) {
        const ordered = _.sortBy(props.columns, col =>
            columnOrder.indexOf(col.path));
        //Columns not included in the columnOrder list will have an index of -1
        //and be at the start of the ordered list
        orderedColumns = _.takeRight(ordered, columnOrder.length);
    }

    //Column parsing
    const columns = orderedColumns.map((col, index) => {
        const props = {
            width: `${columnWidth[index]}%`,
            id: col.key || col.path
        };

        return { ...col, props };
    });

    const common = {
        name, columns
    }

    return (
        <div className="react-select-table">
            <table className={className}>
                <Head {...common}
                    scrollBarWidth={scrollBarWidth} />
            </table>
            <div className="bodyContainer"
                ref={bodyContainer}
                onScroll={handleScroll}
            >
                <div className="tableContainer" tabIndex="0"
                    onKeyDown={handleKeyDown}
                    onMouseDown={handleMouseDown}>
                    {renderSelectionRect()}
                    <table className={className}>
                        <ColumnResizer {...common} />
                        <Body {...common}
                            rowRefs={rowRefs}
                            onDoubleClick={onDoubleClick}
                            valueProperty={valueProperty} />
                    </table>
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
    setActiveRow,
    _setOption
})(TableCore);