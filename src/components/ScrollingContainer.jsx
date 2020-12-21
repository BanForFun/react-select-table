import styles from "../index.scss";

import React, {useCallback, useRef, useState} from 'react';
import useWindowEvent from "../hooks/useWindowEvent";
import ResizingContainer from "./ResizingContainer";
import {sortTuple} from "../utils/mathUtils";
import {SelectionRectContext} from "./SelectionRect";

function ScrollingContainer(props) {
    const {
        showSelectionRect,
        scrollFactor,
        ...resizingProps
    } = props;

    const {
        options,
        options: { utils },
        dispatchers
    } = props;

    const { startIndex, rows } = utils.useSelector(utils.getPaginatedItems);
    const rowCount = rows.length;

    //Component refs
    const bodyContainerRef = useRef();
    const tbodyRef = useRef();

    //Variables refs
    const dragSelection = useRef({});
    const lastMousePos = useRef();
    const lastRelMouseY = useRef();
    const origin = useRef();

    //State
    const [rect, setRect] = useState(null);

    //#region Helpers
    const findRowIndex = useCallback(target => {
        const rows = tbodyRef.current.children;

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
        origin.current = {
            x: relMouseX,
            y: relMouseY,
            index: rowIndex
        };
    }, [options, findRowIndex, startIndex]);

    const updateDragSelection = useCallback(relMouseY => {
        const {
            offsetHeight: tableHeight,
            children: rows
        } = tbodyRef.current;

        const selected = dragSelection.current;

        //Define selection check area
        const [minMouseY, maxMouseY] = sortTuple(relMouseY, lastRelMouseY.current);
        lastRelMouseY.current = relMouseY;

        //Set up search
        const {index: originRow} = origin.current;
        const belowItems = originRow < 0;
        const originItem = originRow + startIndex;

        let rowIndex;
        let setActive = belowItems ? null : originItem;
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

        const searchStart = belowItems ? rowCount : originRow;

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
            : originItem;

        //Modify selection
        Object.assign(selected, selectMap);
        dispatchers.setSelected(selectMap, setActive, setPivot);
    }, [
        rowCount,
        startIndex,
        dispatchers
    ]);

    const updateSelectionRect = useCallback(mousePos => {
        //Cache last position
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

        const {x: originX, y: originY} = origin.current;
        setRect({
            left: Math.min(relMouseX, originX),
            top: Math.min(relMouseY, originY),
            width: Math.abs(relMouseX - originX),
            height: Math.abs(relMouseY - originY)
        });
    }, [
        scrollFactor,
        updateDragSelection,
        showSelectionRect
    ]);

    const handleScroll = useCallback(() => {
        if (!origin.current) return;
        updateSelectionRect(lastMousePos.current);
    }, [updateSelectionRect]);

    const handleDragEnd = useCallback(() => {
        if (!origin.current) return;
        origin.current = null;

        setRect(null);
    }, []);

    //#endregion

    //#region Window events

    useWindowEvent("mousemove", useCallback(e => {
        if (!origin.current) return;
        updateSelectionRect([e.clientX, e.clientY])
    }, [updateSelectionRect]));

    useWindowEvent("touchmove", useCallback(e => {
        if (!origin.current) return;
        e.preventDefault();

        const [touch] = e.touches;
        updateSelectionRect([touch.clientX, touch.clientY]);
    }, [updateSelectionRect]), false);

    useWindowEvent("mouseup", handleDragEnd);
    useWindowEvent("touchend", handleDragEnd);

    //#endregion

    //Set props
    Object.assign(resizingProps,{
        bodyContainerRef,
        tbodyRef,
        dragSelectStart: dragStart
    });

    //Render container
    return <div
        className={styles.scrollingContainer}
        onScroll={handleScroll}
        tabIndex="0"
    >
        <SelectionRectContext.Provider value={rect}>
            <ResizingContainer {...resizingProps} />
        </SelectionRectContext.Provider>
    </div>
}

export default ScrollingContainer;
