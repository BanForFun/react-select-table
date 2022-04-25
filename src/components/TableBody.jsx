import React, {Fragment, useRef, useEffect, useLayoutEffect, useState, useCallback} from 'react';
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
    const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex);
    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);

    const getContainerBounds = useCallback(() => {
        const scrollingContainer = scrollingContainerRef.current;
        const bodyContainer = bodyContainerRef.current;
        return {
            visibleTop: scrollingContainer.scrollTop,
            visibleBottom: scrollingContainer.scrollTop + scrollingContainer.clientHeight - bodyContainer.offsetTop,
            scrollBottom: scrollingContainer.scrollHeight
        }
    }, [scrollingContainerRef, bodyContainerRef]);

    const getRowBounds = useCallback(index => {
        const row = tableBodyRef.current.children[index];
        return {
            top: row.offsetTop,
            bottom: row.offsetTop + row.offsetHeight
        }
    }, [tableBodyRef])

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

    const [spacers, setSpacers] = useState();

    //Don't render invisible rows when resizing columns
    useEffect(() => {
        if (dragMode?.name !== DragModes.Resize)
            return setSpacers(null);

        const containerBounds = getContainerBounds();

        let topVisibleIndex = 0, bottomVisibleIndex;
        _.forEach(tableBodyRef.current.children, (row, index) => {
            if ((row.offsetTop + row.offsetHeight) <= containerBounds.visibleTop) {
                topVisibleIndex = index;
            } else if (row.offsetTop <= containerBounds.visibleBottom) {
                bottomVisibleIndex = index;
            } else return false;
        });

        //Preserve stripped pattern
        if (topVisibleIndex && topVisibleIndex % 2 === 0)
            topVisibleIndex--;

        setSpacers({
            topVisibleIndex,
            bottomVisibleIndex,
            topSpacerHeight: getRowBounds(topVisibleIndex).top,
            bottomSpacerHeight: containerBounds.scrollBottom - getRowBounds(bottomVisibleIndex).bottom
        });
    }, [dragMode, tableBodyRef, getContainerBounds, getRowBounds]);

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
         {spacers ? <Fragment>
             {!!spacers.topSpacerHeight &&
                <tr className="rst-spacer" style={{ height: spacers.topSpacerHeight }}/>}

             {rowValues.slice(spacers.topVisibleIndex, spacers.bottomVisibleIndex + 1)
                 .map((row, index) => renderRow(row, index + spacers.topVisibleIndex))}

             <tr className="rst-spacer" style={{ height: spacers.bottomSpacerHeight }}/>
         </Fragment> : rowValues.map(renderRow)}
    </tbody>
}

export default React.memo(TableBody);
