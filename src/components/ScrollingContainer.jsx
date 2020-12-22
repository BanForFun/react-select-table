import styles from "../index.scss";

import React, {useCallback, useRef, useState} from 'react';
import useEvent from "../hooks/useEvent";
import ResizingContainer from "./ResizingContainer";
import {sortTuple} from "../utils/mathUtils";
import {SelectionRectContext} from "./SelectionRect";
import {matchModifiers} from "../utils/eventUtils";

function ScrollingContainer(props) {
    const {
        showSelectionRect,
        scrollFactor,
        onKeyDown,
        ...resizingProps
    } = props;

    const {
        options,
        options: { utils },
        dispatchers
    } = props;

    const { startIndex, rows } = utils.useSelector(utils.getPaginatedItems);
    const activeIndex = utils.useSelector(t => t.activeIndex);
    const itemCount = utils.useSelector(t => t.tableItems.length);
    const rowCount = rows.length;

    //#region Drag selection

    //Component refs
    const bodyContainerRef = useRef();
    const tableBodyRef = useRef();

    //Variables refs
    const dragSelection = useRef({});
    const lastMousePos = useRef();
    const lastRelMouseY = useRef();
    const origin = useRef();

    //State
    const [rect, setRect] = useState(null);

    const findRowIndex = useCallback(target => {
        const rows = tableBodyRef.current.element.children;

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
        } = tableBodyRef.current.element;

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

    //Event handlers

    const handleScroll = useCallback(() => {
        if (!origin.current) return;
        updateSelectionRect(lastMousePos.current);
    }, [updateSelectionRect]);

    const handleDragEnd = useCallback(() => {
        if (!origin.current) return;
        origin.current = null;

        setRect(null);
    }, []);

    //Window events
    useEvent(document,"mousemove", useCallback(e => {
        if (!origin.current) return;
        updateSelectionRect([e.clientX, e.clientY])
    }, [updateSelectionRect]));

    useEvent(document.body,"touchmove", useCallback(e => {
        e.stopPropagation();

        if (!origin.current) return;
        e.preventDefault();

        const touch = e.touches[0];
        updateSelectionRect([touch.clientX, touch.clientY]);
    }, [updateSelectionRect]), false);

    useEvent(document,"mouseup", handleDragEnd);
    useEvent(document.body,"touchend", handleDragEnd);

    //#endregion

    //#region Keyboard selection

    const selectIndex = useCallback((e, index) => {
        if (matchModifiers(e, true))
            dispatchers.setActive(index);
        else
            dispatchers.select(index, e.ctrlKey, e.shiftKey);

        tableBodyRef.current.scrollToIndex(index);
    }, [dispatchers]);

    const selectOffset = useCallback((e, offset) => {
        if (activeIndex == null) return;

        //Check item index
        const index = activeIndex + offset;
        if (!_.inRange(index, itemCount)) return;

        selectIndex(e, index);
    }, [selectIndex, activeIndex, itemCount]);

    //#endregion


    //Set props
    Object.assign(resizingProps,{
        bodyContainerRef,
        tableBodyRef,
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

export default React.memo(ScrollingContainer);
