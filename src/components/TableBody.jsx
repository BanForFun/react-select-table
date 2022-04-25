import React, {Fragment, useRef, useEffect, useLayoutEffect, useState} from 'react';
import _ from "lodash";
import TableRow from "./TableRow";
import {DragModes} from "../utils/tableUtils";
import {ColumnGroupContext} from "./ColumnGroup";

//Child of BodyContainer
function TableBody(props) {
    const {
        tableBodyRef,
        getRowClassName,
        bodyContainerRef,
        scrollingContainerRef,
        dragMode,
        utils: { hooks, selectors },
        ...rowCommonProps
    } = props;

    const sortedItems = hooks.useSelector(s => s.sortedItems);
    const rowValues = hooks.useSelector(s => s.rowValues);
    const selection = hooks.useSelector(s => s.selection);
    const visibleItemCount = hooks.useSelector(s => s.visibleItemCount);
    const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex);
    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);

    //Ensure active value visible after dragging ends
    const [dragEnded, setDragEnded] = useState(false);
    const prevDragging = useRef(false);
    useEffect(() => {
        if (prevDragging.current && !dragMode)
            setDragEnded(d => !d);

        prevDragging.current = !!dragMode;
    }, [dragMode]);

    //Autoscroll to ensure active value is visible
    useLayoutEffect(() => {
        const scrollingContainer = scrollingContainerRef.current;
        const bodyContainer = bodyContainerRef.current;
        const tableBody = tableBodyRef.current;

        const activeRowBounds = tableBody.children[activeRowIndex].getBoundingClientRect();
        const containerTop = scrollingContainer.getBoundingClientRect().top;
        const headerHeight = bodyContainer.offsetTop;

        const distanceToTop = activeRowBounds.top - (containerTop + headerHeight);
        const distanceToBottom = activeRowBounds.bottom - (containerTop + scrollingContainer.clientHeight);

        const scrollOffset = Math.min(0, distanceToTop) + Math.max(0, distanceToBottom);
        scrollingContainer.scrollTop += scrollOffset;
    }, [
        visibleItemCount, activeRowIndex,
        rowValues, dragEnded,
        tableBodyRef, bodyContainerRef, scrollingContainerRef
    ]);

    // const [spacer, setSpacer] = useState();

    // useEffect(() => {
    //     if (dragMode?.name !== DragModes.Resize) {
    //         setSpacer(null);
    //         return;
    //     }
    //
    //     const scrollingContainer = scrollingContainerRef.current;
    //     const rows = tableBodyRef.current.children;
    //
    //     let topVisibleIndex = 0, bottomVisibleIndex;
    //     _.forEach(rows, (row, index) => {
    //         if ((row.offsetTop + row.offsetHeight) < scrollingContainer.scrollTop) {
    //             topVisibleIndex = index;
    //         } else if (row.offsetTop < (scrollingContainer.scrollTop + scrollingContainer.clientHeight)) {
    //             bottomVisibleIndex = index;
    //         } else return false;
    //     });
    //
    //     const topVisibleRow = rows[topVisibleIndex];
    //     const bottomVisibleRow = rows[bottomVisibleIndex];
    //
    //     setSpacer({
    //         topVisibleIndex,
    //         bottomVisibleIndex,
    //         topSpacerHeight: topVisibleRow.offsetTop,
    //         bottomSpacerHeight: scrollingContainer.scrollHeight -
    //             (bottomVisibleRow.offsetTop + bottomVisibleRow.offsetHeight)
    //     });
    // }, [dragMode, tableBodyRef, scrollingContainerRef]);

    const renderRow = (value, rowIndex) => {
        const { data } = sortedItems[value];

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            data, value, rowIndex, indexOffset,
            active: rowIndex === activeRowIndex,
            selected: selection.has(value),
            className: getRowClassName(data)
        };

        return <TableRow {...rowProps} />;
    };

    return <tbody ref={tableBodyRef}>
        {rowValues.map(renderRow)}
    </tbody>
}

export default React.memo(TableBody);
