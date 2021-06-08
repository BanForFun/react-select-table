import _ from "lodash";
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
        table: { options, utils, selectors },
        actions
    } = props;

    const isLoading = utils.useSelector(s => s.isLoading);
    const error = utils.useSelector(s => s.error);
    const rowValues = utils.useSelector(selectors.getRowValues);

    const [cursorClass, setCursorClass] = useState(null);

    //#region Drag selection

    //Component refs
    const bodyContainerRef = useRef();
    const tableBodyRef = useRef();

    //Variables refs
    const dragSelectionRef = useRef({
        selected: null,
        mousePos: null,
        lastRelMouseY: null,
        originPos: null,
        originRow: null,
        originItem: null
    }).current;

    const isSelectingRef = useRef(false);

    //State
    const [rect, setRect] = useState(null);

    const dragSelectStart = useCallback((mousePos, rowIndex = null, rowValue = null) => {
        //Return if multiSelect is disabled
        if (!options.multiSelect) return;

        //Return if below items and multiSelect listBox
        if (rowIndex === null && options.listBox) return;

        const [mouseX, mouseY] = mousePos;
        const {
            offsetParent: root,
            offsetTop: headerHeight,
            offsetLeft: headerWidth
        } = bodyContainerRef.current;
        const bounds = root.getBoundingClientRect();

        const relMouseX = mouseX + root.scrollLeft - bounds.x - headerWidth;
        const relMouseY = mouseY + root.scrollTop - bounds.y - headerHeight;

        Object.assign(dragSelectionRef, {
            selected: {},
            mousePos,
            lastRelMouseY: relMouseY,
            originPos: [relMouseX, relMouseY],
            originValue: rowValue,
            originRow: rowIndex
        });

        setCursorClass("rst-selecting");
        isSelectingRef.current = true;
    }, [options]);

    const updateDragSelection = useCallback(relMouseY => {
        const tableBody = tableBodyRef.current;
        if (!tableBody) return;

        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBody;

        //Define selection check area
        const [minMouseY, maxMouseY] = _.sortTuple(relMouseY, dragSelectionRef.lastRelMouseY);
        dragSelectionRef.lastRelMouseY = relMouseY;

        //Set up search
        const { originRow, originValue } = dragSelectionRef;
        const rowCount = rowValues.length;
        const selectedMap = {};

        let rowIndex;
        let setActive = originValue;
        let setPivot = originValue;

        let updates = 0;

        const updateCurrent = select => {
            updates++;
            const value = rowValues[rowIndex];

            if (select !== dragSelectionRef.selected[value])
                selectedMap[value] = select;

            if (!select) return;
            setActive = value;
            setPivot ??= value;
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

        if (_.isEmpty(selectedMap)) return;

        console.log("Updates:", updates);

        //Reselect origin row in the case that the user started drag selecting after ctrl-deselecting the origin row.
        //Do it only if the cursor is outside of the origin row to not annoy the user trying to deselect
        if (originValue !== null)
            selectedMap[originValue] = true;

        //Modify selection
        Object.assign(dragSelectionRef.selected, selectedMap);
        actions.setSelected(selectedMap, setActive, setPivot);

    }, [rowValues, actions]);

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
        const [mouseX, mouseY] = dragSelectionRef.mousePos;

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

        const [originX, originY] = dragSelectionRef.originPos;
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
        if (!isSelectingRef.current) return;

        updateSelectionRect();
    }, [updateSelectionRect]);

    const handleDragEnd = useCallback(() => {
        setCursorClass(null);

        if (!isSelectingRef.current) return;
        isSelectingRef.current = false;

        setRect(null);
    }, []);

    //Window events
    useEvent(window, "mousemove", useCallback(e => {
        if (!isSelectingRef.current) return;

        dragSelectionRef.mousePos = [e.clientX, e.clientY];
        updateSelectionRect()
    }, [updateSelectionRect]));

    useEvent(window, "touchmove", useCallback(e => {
        e.stopPropagation();

        if (!isSelectingRef.current) return;
        e.preventDefault();

        const touch = e.touches[0];
        dragSelectionRef.mousePos = [touch.clientX, touch.clientY];
        updateSelectionRect();
    }, [updateSelectionRect]), false);

    useEvent(window, "mouseup", handleDragEnd);
    useEvent(window, "touchend", handleDragEnd);

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
        dragSelectStart,
        scrollToPos,
        setCursorClass,
        isSelectingRef
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
