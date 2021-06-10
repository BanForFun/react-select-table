import _ from "lodash";
import React, {useCallback, useMemo, useRef, useState} from 'react';
import classNames from "classnames";
import useEvent from "../hooks/useEvent";
import ResizingContainer from "./ResizingContainer";
import {activeClass, selectedClass} from "./TableRow";

const px = n => `${n}px`;

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
    const tableBodyRef = useRef({
        activeIndex: 0,
        element: null
    }).current;
    const selectionRectRef = useRef();

    //Variables refs
    const dragSelectionRef = useRef({}).current;
    const isSelectingRef = useRef(false);

    const applyRectStyles = useCallback(styles => {
        Object.assign(selectionRectRef.current.style, styles);
    }, [selectionRectRef]);

    //State
    const dragSelectStart = useCallback((mousePos, rowIndex = null) => {
        //Return if multiSelect is disabled
        if (!options.multiSelect) return;

        //Return if below items and multiSelect listBox
        if (rowIndex === null && options.listBox) return;

        const {
            offsetParent: root,
            offsetTop: headerHeight,
            offsetLeft: headerWidth
        } = bodyContainerRef.current;

        const bounds = root.getBoundingClientRect();
        const relX = mousePos[0] + root.scrollLeft - bounds.x - headerWidth;
        const relY = mousePos[1] + root.scrollTop - bounds.y - headerHeight;

        //Setup selection rect
        applyRectStyles({
            transform: `translate(${headerWidth}px, ${headerHeight}px)`
        });

        const safeRowIndex = rowIndex ?? rowValues.length;

        Object.assign(dragSelectionRef, {
            selected: {},
            active: rowIndex ?? tableBodyRef.activeIndex,
            pivot: -1,
            mousePos,
            prevIndex: safeRowIndex,
            prevRelY: relY,
            originRelPos: [relX, relY],
            originIndex: safeRowIndex,
            pendingFrames: 0
        });

        setCursorClass("rst-selecting");
        isSelectingRef.current = true;
    }, [options, applyRectStyles, rowValues]);

    const dragSelectEnd = useCallback(() => {
        applyRectStyles({ display: "none" });

        //0 length timeout to avoid delaying the frame when called from within requestAnimationFrame
        setTimeout(() => {
            setCursorClass(null);

            const { selected, active, pivot } = dragSelectionRef;
            actions.setSelected(
                _.mapKeys(selected, (_, index) => rowValues[index]),
                rowValues[active], rowValues[pivot]
            );
        });
    }, [applyRectStyles, actions, rowValues, setCursorClass]);

    const updateSelection = useCallback(relY => {
        //Define selection check area
        const { prevRelY, originIndex, prevIndex, selected } = dragSelectionRef;
        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBodyRef.element;

        if (relY === prevRelY) return;

        const upwards = relY < prevRelY;
        const fallbackIndex = rows.length;
        const newlySelected = {};
        let index = prevIndex;

        while (true) {
            if (index === fallbackIndex) {
                if (relY > tableHeight) break;

                dragSelectionRef.pivot = rows.length - 1;
            } else {
                const row = rows[index];
                if (upwards && relY >= row.offsetTop) break;
                if (!upwards && relY <= row.offsetTop + row.offsetHeight) break;

                const abovePivot = index < originIndex;
                newlySelected[index] = index === originIndex || abovePivot === upwards;
            }

            index += upwards ? -1 : 1;
            if (index === fallbackIndex) break;

            newlySelected[index] = true;
            dragSelectionRef.active = index;
        }

        if (index === prevIndex) return;

        Object.assign(selected, newlySelected);
        Object.assign(dragSelectionRef, {
            prevIndex: index,
            prevRelY: relY
        });

        return newlySelected;
    }, []);

    const getScrollPos = useCallback((point, scroll, start, size, margin) => {
        const add = point - start - size;
        const sub = start + margin - point;

        if (add > 0)
            scroll += add * scrollFactor;
        else if (sub > 0)
            scroll -= sub * scrollFactor;

        scroll = Math.max(scroll, 0);

        const relative = point + scroll - start - margin;
        return { scroll, relative };
    }, [scrollFactor])

    const scrollToPos = useCallback((x, y) => {
        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const bounds = root.getBoundingClientRect();

        const relative = [];

        if (x !== null) {
            const result = getScrollPos(x, root.scrollLeft, bounds.left, root.clientWidth, body.offsetLeft);
            root.scrollLeft = result.scroll;
            relative[0] = _.clamp(result.relative, 0, body.scrollWidth);
        }

        if (y !== null) {
            const result = getScrollPos(y, root.scrollTop, bounds.top, root.clientHeight, body.offsetTop);
            root.scrollTop = result.scroll;
            relative[1] = _.clamp(result.relative, 0, body.scrollHeight);
        }

        return relative;
    }, [getScrollPos])

    const updateSelectionRect = useCallback((mousePos = null) => {
        //Cache mouse position
        if (mousePos)
            dragSelectionRef.mousePos = mousePos;
        else
            mousePos = dragSelectionRef.mousePos;

        //Scroll to mouse position
        const [relMouseX, relMouseY] = scrollToPos(mousePos[0], mousePos[1]);

        //Update selection
        const prevActive = dragSelectionRef.active;
        const newlySelected = updateSelection(relMouseY);

        const {
            originRelPos: [originX, originY],
            active
        } = dragSelectionRef;

        dragSelectionRef.pendingFrames++;
        requestAnimationFrame(() => {
            if (newlySelected) {
                const getClassList = index => tableBodyRef.element.children[index].classList;

                getClassList(prevActive).remove(activeClass);
                getClassList(active).add(activeClass);

                _.forEach(newlySelected, (selected, index) => {
                    getClassList(index).toggle(selectedClass, selected)
                });
            }

            if (showSelectionRect) {
                applyRectStyles({
                    display: "block",
                    left: px(Math.min(relMouseX, originX)),
                    top: px(Math.min(relMouseY, originY)),
                    width: px(Math.abs(relMouseX - originX)),
                    height: px(Math.abs(relMouseY - originY))
                });
            }

            if (!--dragSelectionRef.pendingFrames && !isSelectingRef.current)
                //Give time for current frame to be rendered
                requestAnimationFrame(dragSelectEnd);
        });
    }, [
        updateSelection,
        showSelectionRect,
        scrollToPos,
        dragSelectEnd
    ]);

    //Event handlers

    const handleScroll = useCallback(() => {
        if (!isSelectingRef.current) return;

        updateSelectionRect();
    }, [updateSelectionRect]);

    const handleDragEnd = useCallback(() => {
        if (!isSelectingRef.current)
            return setCursorClass(null);

        isSelectingRef.current = false;

        if (!dragSelectionRef.pendingFrames)
            dragSelectEnd();

    }, [setCursorClass, dragSelectEnd]);

    //Window events
    useEvent(window, "mousemove", useCallback(e => {
        if (!isSelectingRef.current) return;

        updateSelectionRect([e.clientX, e.clientY])
    }, [updateSelectionRect]));

    useEvent(window, "touchmove", useCallback(e => {
        e.stopPropagation();

        if (!isSelectingRef.current) return;
        e.preventDefault();

        const touch = e.touches[0];
        updateSelectionRect([touch.clientX, touch.clientY]);
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
        selectionRectRef,
        dragSelectStart,
        scrollToPos,
        setCursorClass,
        isSelectingRef
    });

    return <div
        className={classNames("rst-scrollingContainer", cursorClass)}
        onScroll={handleScroll}
    >
        {showPlaceholder
            ? <div className="rst-tablePlaceholder">{renderPlaceholder()}</div>
            : <ResizingContainer {...resizingProps} />
        }
    </div>
}

export default React.memo(ScrollingContainer);
