import React, {Fragment, useRef, useEffect, useLayoutEffect, useState, useCallback} from 'react';
import _ from "lodash";
import TableRow from "./TableRow";
import {DragModes, px} from "../utils/tableUtils";
import {ColumnGroupContext} from "./ColumnGroup";

const SpacerClass = "rst-spacer";

//Child of BodyContainer
function TableBody(props) {
    const {
        tableBodyRef,
        getRowClassName,
        bodyContainerRef,
        scrollingContainerRef,
        dragMode,
        getRowBounds,
        utils: { hooks, selectors },
        ...rowCommonProps
    } = props;

    const sortedItems = hooks.useSelector(s => s.sortedItems);
    const rowValues = hooks.useSelector(s => s.rowValues);
    const selection = hooks.useSelector(s => s.selection);
    const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex);
    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);

    //#region Autoscroll to active row
    const getContainerBounds = useCallback(() => {
        const scrollingContainer = scrollingContainerRef.current;
        const bodyContainer = bodyContainerRef.current;
        return {
            visibleTop: scrollingContainer.scrollTop,
            visibleBottom: scrollingContainer.scrollTop + scrollingContainer.clientHeight - bodyContainer.offsetTop
        }
    }, [scrollingContainerRef, bodyContainerRef]);

    //Autoscroll to ensure active value is visible
    useLayoutEffect(() => {
        const rowBounds = getRowBounds(activeRowIndex);
        const containerBounds = getContainerBounds();

        const distanceToTop = rowBounds.top - containerBounds.visibleTop;
        const distanceToBottom = rowBounds.bottom - containerBounds.visibleBottom;

        const scrollOffset = Math.min(0, distanceToTop) + Math.max(0, distanceToBottom);
        scrollingContainerRef.current.scrollTop += scrollOffset;
    }, [
        activeRowIndex,
        rowValues,
        scrollingContainerRef, getContainerBounds, getRowBounds
    ]);
    //#endregion

    //#region Hide invisible rows
    const getVisibleRows = useCallback(() => {
        const containerBounds = getContainerBounds();

        let minVisible = 0, maxVisible;
        _.forEach(tableBodyRef.current.children, (row, index) => {
            if ((row.offsetTop + row.offsetHeight) <= containerBounds.visibleTop) {
                minVisible = index;
            } else if (row.offsetTop <= containerBounds.visibleBottom) {
                maxVisible = index;
            } else return false;
        });

        //Preserve stripped pattern
        if (minVisible && minVisible % 2 === 0)
            minVisible--;

        return { min: minVisible, max: maxVisible };
    }, [getContainerBounds, tableBodyRef]);

    const hideInvisibleRows = useCallback(() => {
        //Get visible rows
        const visibleRows = getVisibleRows();

        //Save invisible rows
        const body = tableBodyRef.current;
        const rows = body.children;
        hiddenRows.current = {
            top: _.slice(rows, 0, visibleRows.min),
            bottom: _.slice(rows, visibleRows.max + 1)
        };

        //Calculate spacer heights
        const topSpacerHeight = getRowBounds(visibleRows.min).top;
        const bottomSpacerHeight = body.offsetHeight - getRowBounds(visibleRows.max).bottom;

        //Remove invisible rows
        hiddenRows.current.top.forEach(row => row.remove());
        hiddenRows.current.bottom.forEach(row => row.remove());

        //Add top spacer
        if (topSpacerHeight) {
            const topSpacer = body.insertRow(0);
            topSpacer.classList.add(SpacerClass);
            topSpacer.style.height = px(topSpacerHeight);
        }

        //Add bottom spacer
        if (bottomSpacerHeight) {
            const bottomSpacer = body.insertRow();
            bottomSpacer.classList.add(SpacerClass);
            bottomSpacer.style.height = px(bottomSpacerHeight);
        }
    }, [getRowBounds, getVisibleRows, tableBodyRef]);

    const restoreInvisibleRows = useCallback(() => {
        const body = tableBodyRef.current;
        const spacers = body.getElementsByClassName(SpacerClass);

        //Restore saved rows
        const { top, bottom } = hiddenRows.current;
        top.forEach(row => body.insertBefore(row, spacers[0]));
        bottom.forEach(row => body.appendChild(row));

        //Remove spacers
        _.forEach(spacers,() => spacers[0].remove());

        hiddenRows.current = null;
    }, [tableBodyRef]);

    //Don't render invisible rows when resizing columns
    const hiddenRows = useRef();
    useLayoutEffect(() => {
        if (dragMode?.name === DragModes.Resize)
            hideInvisibleRows();
        else if (hiddenRows.current)
            restoreInvisibleRows();
    }, [dragMode, hideInvisibleRows, restoreInvisibleRows, rowValues]);
    //#endregion

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
