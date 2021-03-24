import React, {useCallback, useRef, useState} from 'react';
import classNames from "classnames";
import useEvent from "../hooks/useEvent";
import ResizingContainer from "./ResizingContainer";
import {SelectionRectContext} from "./SelectionRect";

//Child of Root
function ScrollingContainer(props) {
    const {
        showSelectionRect,
        scrollFactor,
        loadingIndicator,
        Error,
        showPlaceholder,
        ...resizingProps
    } = props;

    const {
        storage: { options, utils, selectors },
        actions
    } = props;

    const rows = utils.useSelector(selectors.getPaginatedItems);
    const startIndex = utils.useSelector(selectors.getFirstVisibleIndex);
    const isLoading = utils.useSelector(s => s.isLoading);
    const error = utils.useSelector(s => s.error);
    const rowCount = rows.length;

    const [cursorClass, setCursorClass] = useState(null);

    //#region Drag selection

    //Component refs
    const bodyContainerRef = useRef();
    const tableBodyRef = useRef();

    //Variables refs
    const dragSelection = useRef({
        selected: null,
        mousePos: null,
        lastRelMouseY: null,
        originPos: null,
        originRow: null,
        originItem: null
    }).current;

    const isSelecting = useRef(false);

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

        setCursorClass("rst-selecting");
        isSelecting.current = true;
    }, [options, startIndex]);

    const updateDragSelection = useCallback(relMouseY => {
        const tableBody = tableBodyRef.current;
        if (!tableBody) return;

        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBody;

        //Define selection check area
        const [minMouseY, maxMouseY] = _.sortTuple(relMouseY, dragSelection.lastRelMouseY);
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
        actions.setSelected(selectMap, setActive, setPivot);
    }, [
        rowCount,
        startIndex,
        actions
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
        if (!isSelecting.current) return;

        updateSelectionRect();
    }, [updateSelectionRect]);

    const handleDragEnd = useCallback(() => {
        setCursorClass(null);

        if (!isSelecting.current) return;
        isSelecting.current = false;

        setRect(null);
    }, []);

    //Window events
    useEvent(document,"mousemove", useCallback(e => {
        if (!isSelecting.current) return;

        dragSelection.mousePos = [e.clientX, e.clientY];
        updateSelectionRect()
    }, [updateSelectionRect]));

    useEvent(document.body,"touchmove", useCallback(e => {
        e.stopPropagation();

        if (!isSelecting.current) return;
        e.preventDefault();

        const touch = e.touches[0];
        dragSelection.mousePos = [touch.clientX, touch.clientY];
        updateSelectionRect();
    }, [updateSelectionRect]), false);

    useEvent(document,"mouseup", handleDragEnd);
    useEvent(document.body,"touchend", handleDragEnd);

    //#endregion

    //Placeholder
    const renderPlaceholder = useCallback(() => {
        if (isLoading)
            return loadingIndicator;

        if (error)
            return <Error error={error}/>;

        return null;
    }, [isLoading, error, loadingIndicator]);

    //Set props
    Object.assign(resizingProps,{
        bodyContainerRef,
        tableBodyRef,
        dragSelectStart: dragStart,
        scrollToPos,
        setCursorClass,
        isSelecting
    });

    return <div
        className={classNames("rst-scrollingContainer", cursorClass)}
        onScroll={handleScroll}
    >
        <SelectionRectContext.Provider value={rect}>
            {showPlaceholder
                ? <div className="rst-tablePlaceholder">{renderPlaceholder()}</div>
                : <ResizingContainer {...resizingProps} />
            }
        </SelectionRectContext.Provider>
    </div>
}

export default React.memo(ScrollingContainer);
