import styles from "../index.scss";

import React, {useCallback, useRef, useState} from 'react';
import classNames from "classnames";
import useEvent from "../hooks/useEvent";
import ResizingContainer from "./ResizingContainer";
import {sortTuple} from "../utils/mathUtils";
import {SelectionRectContext} from "./SelectionRect";
import {matchModifiers} from "../utils/eventUtils";
import useGetSelectionArg from "../hooks/useGetSelectionArg";

function ScrollingContainer(props) {
    const {
        showSelectionRect,
        scrollFactor,
        onKeyDown,
        itemContainerRef,
        placeholder,
        ...resizingProps
    } = props;

    const {
        options,
        options: { utils },
        onItemsOpen,
        dispatchers
    } = props;

    const { startIndex, rows } = utils.useSelector(utils.getPaginatedItems);
    const activeIndex = utils.useSelector(t => t.activeIndex);
    const itemCount = utils.useSelector(t => t.tableItems.length);
    const selectedCount = utils.useSelector(t => t.selection.size);
    const rowCount = rows.length;

    const [cursorClass, setCursorClass] = useState(null);

    //#region Drag selection

    //Component refs
    const bodyContainerRef = useRef();
    const tableBodyRef = useRef();

    //Variables refs
    const {current: dragSelection} = useRef({
        selected: null,
        mousePos: null,
        lastRelMouseY: null,
        originPos: null,
        originRow: null,
        originItem: null
    });

    //State
    const [rect, setRect] = useState(null);

    const dragStart = useCallback((mousePos, itemIndex = null) => {
        //Return if multiSelect is disabled
        if (!options.multiSelect) return;

        //Return if below items and multiSelect listBox
        if (itemIndex === null && options.listBox) return;

        const [mouseX, mouseY] = mousePos;
        const {
            offsetParent: root,
            offsetTop: headerHeight,
            offsetLeft: headerWidth
        } = bodyContainerRef.current;
        const bounds = root.getBoundingClientRect();

        const relMouseX = mouseX + root.scrollLeft - bounds.x - headerWidth;
        const relMouseY = mouseY + root.scrollTop - bounds.y - headerHeight;

        const state = Object.assign(dragSelection, {
            selected: {},
            mousePos,
            lastRelMouseY: relMouseY,
            originPos: [relMouseX, relMouseY],
            originItem: itemIndex,
            originRow: null
        });

        if (itemIndex !== null) {
            state.selected[itemIndex] = true;
            state.originRow = itemIndex - startIndex;
        }

        setCursorClass(styles.selecting);
    }, [options, startIndex]);

    const updateDragSelection = useCallback(relMouseY => {
        const tableBody = tableBodyRef.current;
        if (!tableBody) return;

        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBody.element;

        //Define selection check area
        const [minMouseY, maxMouseY] = sortTuple(relMouseY, dragSelection.lastRelMouseY);
        dragSelection.lastRelMouseY = relMouseY;

        //Set up search
        const { originRow, originItem } = dragSelection;

        let rowIndex;
        let setActive = originItem;
        const selectMap = {};

        const updateCurrent = select => {
            const itemIndex = startIndex + rowIndex;

            if (select !== dragSelection.selected[itemIndex])
                selectMap[itemIndex] = select;

            if (select)
                setActive = itemIndex;
        }

        const getCurrentTop = () =>
            rowIndex >= rowCount ? tableHeight : rows[rowIndex].offsetTop;

        const searchStart = originRow ?? rowCount;

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

        //If origin is below rows, set the pivot to the last row ONLY if it is selected
        const lastItemIndex = startIndex + rowCount - 1;
        const setPivot = originItem ?? (selectMap[lastItemIndex] ? lastItemIndex : null)

        //Modify selection
        Object.assign(dragSelection.selected, selectMap);
        dispatchers.setSelected(selectMap, setActive, setPivot);
    }, [
        rowCount,
        startIndex,
        dispatchers
    ]);

    const scrollToPos = useCallback((x, y) => {
        function calculate(scroll, target, start, size, margin) {
            const add = target - start - size;
            const sub = start + margin - target;

            if (add > 0)
                scroll += add * scrollFactor;
            else if (sub > 0)
                scroll -= sub * scrollFactor;

            const safeScroll = Math.max(scroll, 0);
            const relative = target + safeScroll - start - margin;
            return { scroll, relative };
        }

        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const bounds = root.getBoundingClientRect();

        const relative = [];

        if (x !== null) {
            const result = calculate(root.scrollLeft, x, bounds.left, root.clientWidth, body.offsetLeft);
            root.scrollLeft = result.scroll;
            relative[0] = result.relative;
        }

        if (y !== null) {
            const result = calculate(root.scrollTop, y, bounds.top, root.clientHeight, body.offsetTop);
            root.scrollTop = result.scroll;
            relative[1] = result.relative;
        }

        return relative;
    }, [scrollFactor])

    const updateSelectionRect = useCallback(() => {
        const [mouseX, mouseY] = dragSelection.mousePos;

        //Get body values
        const {
            scrollWidth,
            scrollHeight
        } = bodyContainerRef.current;

        //Calculate relative mouse position
        let [relMouseX, relMouseY] = scrollToPos(mouseX, mouseY);
        relMouseX = _.clamp(relMouseX, 0, scrollWidth);
        relMouseY = _.clamp(relMouseY, 0, scrollHeight);

        //Update selection
        updateDragSelection(relMouseY);

        //Update rectangle
        if (!showSelectionRect) return;

        const [originX, originY] = dragSelection.originPos;
        setRect({
            left: Math.min(relMouseX, originX),
            top: Math.min(relMouseY, originY),
            width: Math.abs(relMouseX - originX),
            height: Math.abs(relMouseY - originY)
        });
    }, [
        updateDragSelection,
        showSelectionRect,
        scrollToPos,
        scrollFactor
    ]);

    //Event handlers

    const handleScroll = useCallback(() => {
        if (!dragSelection.originPos) return;
        updateSelectionRect();
    }, [updateSelectionRect]);

    const handleDragEnd = useCallback(() => {
        setCursorClass(null);

        if (!dragSelection.originPos) return;
        dragSelection.originPos = null;
        setRect(null);
    }, []);

    //Window events
    useEvent(document,"mousemove", useCallback(e => {
        if (!dragSelection.originPos) return;
        dragSelection.mousePos = [e.clientX, e.clientY];
        updateSelectionRect()
    }, [updateSelectionRect]));

    useEvent(document.body,"touchmove", useCallback(e => {
        e.stopPropagation();

        if (!dragSelection.originPos) return;
        e.preventDefault();

        const touch = e.touches[0];
        dragSelection.mousePos = [touch.clientX, touch.clientY];
        updateSelectionRect();
    }, [updateSelectionRect]), false);

    useEvent(document,"mouseup", handleDragEnd);
    useEvent(document.body,"touchend", handleDragEnd);

    //#endregion

    //#region Keyboard selection

    const selectIndex = useCallback((e, index) => {
        if (matchModifiers(e, true, false))
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


    //Event handlers

    const getSelectionArg = useGetSelectionArg(utils);

    const handleKeyDown = useCallback(e => {
        if (placeholder) return;

        switch (e.keyCode) {
            case 65: //A
                if (matchModifiers(e, true, false) && options.multiSelect)
                    dispatchers.selectAll();

                break;
            case 38: //Up
                selectOffset(e, -1);
                break;
            case 40: //Down
                selectOffset(e, 1);
                break;
            case 36: //Home
                selectIndex(e, 0);
                break;
            case 35: //End
                selectIndex(e, itemCount - 1);
                break;
            case 13: //Enter
                if (matchModifiers(e, false, false) && selectedCount)
                    onItemsOpen(getSelectionArg(), true);
                else
                    dispatchers.select(activeIndex, e.ctrlKey, e.shiftKey);

                break;
            default:
                onKeyDown(e, getSelectionArg());
                return;
        }

        e.preventDefault();
    }, [
        dispatchers, options, placeholder,
        itemCount, activeIndex, selectedCount,
        selectOffset, selectIndex, getSelectionArg,
        onKeyDown, onItemsOpen
    ]);

    //#endregion

    //Set props
    Object.assign(resizingProps,{
        bodyContainerRef,
        tableBodyRef,
        dragSelectStart: dragStart,
        scrollToPos,
        setCursorClass
    });

    //Render container
    const className = classNames(
        styles.scrollingContainer,
        cursorClass
    )

    return <div
        ref={itemContainerRef}
        className={className}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex="0"
    >
        {placeholder ??
            <SelectionRectContext.Provider value={rect}>
                <ResizingContainer {...resizingProps} />
            </SelectionRectContext.Provider>
        }
    </div>
}

export default React.memo(ScrollingContainer);
