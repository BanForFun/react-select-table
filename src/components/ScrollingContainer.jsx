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
    const tableBodyRef = useRef();
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

        const [mouseX, mouseY] = mousePos;
        const {
            offsetParent: root,
            offsetTop: headerHeight,
            offsetLeft: headerWidth
        } = bodyContainerRef.current;
        const bounds = root.getBoundingClientRect();

        //Setup selection rect
        applyRectStyles({
            transform: `translate(${headerWidth}px, ${headerHeight}px)`
        });

        const relX = mouseX + root.scrollLeft - bounds.x - headerWidth;
        const relY = mouseY + root.scrollTop - bounds.y - headerHeight;

        Object.assign(dragSelectionRef, {
            selected: {},
            active: -1,
            pivot: -1,
            mousePos,
            prevIndex: rowIndex,
            prevRelY: relY,
            originRelPos: [relX, relY],
            originIndex: rowIndex,
            pendingFrames: 0
        });

        setCursorClass("rst-selecting");
        isSelectingRef.current = true;
    }, [options, applyRectStyles]);

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
        if (relY === prevRelY) return;

        const upwards = relY < prevRelY;

        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBodyRef.current;

        let index = prevIndex;
        let element = rows[index];

        //TODO: Fix crash when selecting below items

        const newlySelected = {};

        while (true) {
            if (upwards && relY >= element.offsetTop) break;
            if (!upwards && relY < element.offsetTop + element.offsetHeight) break;

            const abovePivot = index < originIndex;
            newlySelected[index] = index === originIndex || abovePivot === upwards;

            index += upwards ? -1 : 1;
            element = upwards ? element.previousSibling : element.nextSibling;

            newlySelected[index] = true;
            dragSelectionRef.active = index;
        }

        if (index === prevIndex) return;

        //Reselect origin row in the case that the user started drag selecting after ctrl-deselecting the origin row.
        //Do it only if the cursor is outside of the origin row to not annoy the user trying to deselect
        // if (originValue !== null)
        //     newlySelected[originValue] = true;

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
            relative[0] = result.relative;
        }

        if (y !== null) {
            const result = getScrollPos(y, root.scrollTop, bounds.top, root.clientHeight, body.offsetTop);
            root.scrollTop = result.scroll;
            relative[1] = result.relative;
        }

        return relative;
    }, [getScrollPos])

    const updateSelectionRect = useCallback((mousePos = null) => {
        //Cache mouse position
        if (mousePos)
            dragSelectionRef.mousePos = mousePos;
        else
            mousePos = dragSelectionRef.mousePos;

        //Get body values
        const { scrollWidth, scrollHeight } = bodyContainerRef.current;

        //Calculate relative mouse position
        let [relMouseX, relMouseY] = scrollToPos(mousePos[0], mousePos[1]);
        relMouseX = _.clamp(relMouseX, 0, scrollWidth);
        relMouseY = _.clamp(relMouseY, 0, scrollHeight);

        //Update selection
        const newlySelected = updateSelection(relMouseY);

        const {
            originRelPos: [originX, originY],
            active
        } = dragSelectionRef;

        dragSelectionRef.pendingFrames++;
        requestAnimationFrame(() => {
            if (newlySelected) {
                const rows = tableBodyRef.current.children;

                _.forEach(newlySelected, (selected, index) => {
                    const { classList } = rows[index];
                    classList.toggle(selectedClass, selected);
                    classList.toggle(activeClass, +index === active);
                })
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
                dragSelectEnd();
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
