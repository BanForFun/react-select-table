import _ from "lodash";
import React, {useCallback, useRef, useState} from 'react';
import useEvent from "../hooks/useEvent";
import ResizingContainer from "./ResizingContainer";
import {ActiveClass, SelectedClass} from "./TableRow";
import CursorOverlay from "./CursorOverlay";

const px = n => `${n}px`;

//Child of Root
function ScrollingContainer(props) {
    const {
        showSelectionRect,
        dragSelectionScrollFactor: scrollFactor,
        ...resizingProps
    } = props;

    const {
        utils: { options, hooks },
        actions
    } = props;

    const rowValues = hooks.useSelector(s => s.rowValues);

    const [mode, setMode] = useState(null);

    //#region Drag selection

    //Element refs
    const tableBodyRef = useRef();
    const selectionRectRef = useRef();
    const bodyContainerRef = useRef();

    //Variables refs
    const dragSelectionRef = useRef({
        started: false
    }).current;

    const applyRectStyles = useCallback(styles => {
        Object.assign(selectionRectRef.current.style, styles);
    }, [selectionRectRef]);

    //State
    const dragSelectStart = useCallback((mousePos, rowIndex = null) => {
        //Return if multiSelect is disabled
        if (!options.multiSelect) return;

        //Return if below items and multiSelect listBox
        if (rowIndex === null && options.listBox) return;

        setMode("selecting");

        const {
            offsetParent: scrollingContainer,
            offsetTop: headerHeight,
            offsetLeft: headerWidth
        } = bodyContainerRef.current;

        const bounds = scrollingContainer.getBoundingClientRect();
        const relPos = [];
        relPos[0] = mousePos[0] + scrollingContainer.scrollLeft - bounds.x - headerWidth;
        relPos[1] = mousePos[1] + scrollingContainer.scrollTop - bounds.y - headerHeight;

        rowIndex ??= rowValues.length;

        Object.assign(dragSelectionRef, {
            started: true,
            selected: {},
            active: -1,
            pivot: -1,
            mousePos,
            prevIndex: rowIndex,
            originIndex: rowIndex,
            prevRelPos: relPos,
            originRelPos: relPos,
            pendingFrames: 0
        });
    }, [options, applyRectStyles, rowValues]);

    const dragSelectEnd = useCallback(() => {
        applyRectStyles({ display: "none" });

        //0 length timeout to avoid delaying the frame when called from within requestAnimationFrame
        setTimeout(() => {
            setMode(null);

            const { selected, active, pivot } = dragSelectionRef;
            if (active < 0) return;

            actions.setSelected(
                _.mapKeys(selected, (_, index) => rowValues[index]),
                active, rowValues[pivot]
            );
        });
    }, [applyRectStyles, actions, rowValues, setMode]);

    const updateSelection = useCallback(relY => {
        const prevRelY = dragSelectionRef.prevRelPos[1];
        if (relY === prevRelY) return;

        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBodyRef.current;

        const { originIndex, prevIndex } = dragSelectionRef;
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

        Object.assign(dragSelectionRef.selected, newlySelected);
        dragSelectionRef.prevIndex = index;

        return newlySelected;
    }, []);

    const getScrollPos = useCallback((
        absPoint,
        scroll, start,
        clientSize, scrollSize, headerSize
    ) => {
        const visibleStart = start + headerSize;
        const visibleEnd = start + clientSize;

        const scrollOffset =
            Math.max(0, absPoint - visibleEnd) -
            Math.max(0, visibleStart - absPoint)

        scroll += scrollOffset * scrollFactor;

        return {
            point: _.clamp(absPoint - start + scroll - headerSize, 0, scrollSize),
            scroll
        };
    }, [scrollFactor])

    const scrollToPos = useCallback(absPos => {
        const relPos = [];
        const scrollPos = [];

        function setScrollPos(index, ...rest) {
            const result = getScrollPos(absPos[index], ...rest);
            relPos[index] = result.point;
            scrollPos[index] = result.scroll;
        }

        const bodyContainer = bodyContainerRef.current;
        const scrollingContainer = bodyContainer.offsetParent;
        const scrollingContainerBounds = scrollingContainer.getBoundingClientRect();

        setScrollPos(0,
            scrollingContainer.scrollLeft, scrollingContainerBounds.left, scrollingContainer.clientWidth,
            bodyContainer.scrollWidth, bodyContainer.offsetLeft
        );
        setScrollPos(1,
            scrollingContainer.scrollTop, scrollingContainerBounds.top, scrollingContainer.clientHeight,
            bodyContainer.scrollHeight, bodyContainer.offsetTop
        );

        return { relPos, scrollPos };
    }, [getScrollPos])

    const updateSelectionRect = useCallback((mousePos = null) => {
        //Cache mouse position
        if (mousePos)
            dragSelectionRef.mousePos = mousePos;
        else
            mousePos = dragSelectionRef.mousePos;

        //Scroll to mouse position
        const {relPos, scrollPos} = scrollToPos(mousePos);
        const [relX, relY] = relPos;

        //Update selection
        const newlySelected = updateSelection(relY);

        const {
            originRelPos: [originX, originY],
            active
        } = dragSelectionRef;

        const rectBounds = showSelectionRect && {
            left: px(Math.min(relX, originX)),
            top: px(Math.min(relY, originY)),
            width: px(Math.abs(relX - originX)),
            height: px(Math.abs(relY - originY))
        };

        dragSelectionRef.prevRelPos = relPos;
        dragSelectionRef.pendingFrames++;
        requestAnimationFrame(() => {
            if (newlySelected) {
                const tableBody = tableBodyRef.current;
                const getClassList = index => tableBody.children[index].classList;

                const [activeRow] = tableBody.getElementsByClassName(ActiveClass);
                activeRow.classList.remove(ActiveClass);

                getClassList(active).add(ActiveClass);

                _.forEach(newlySelected, (selected, index) => {
                    getClassList(index).toggle(SelectedClass, selected);
                });
            }

            Object.assign(bodyContainerRef.current.offsetParent, {
                scrollLeft: scrollPos[0],
                scrollTop: scrollPos[1]
            });

            if (rectBounds) {
                applyRectStyles({ display: "block" });
                applyRectStyles(rectBounds);
            }

            if (!--dragSelectionRef.pendingFrames && !dragSelectionRef.started)
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
        if (!dragSelectionRef.started) return;

        updateSelectionRect();
    }, [updateSelectionRect]);

    const handleDragEnd = useCallback(() => {
        if (!dragSelectionRef.started)
            return setMode(null);

        dragSelectionRef.started = false;

        if (!dragSelectionRef.pendingFrames)
            dragSelectEnd();

    }, [setMode, dragSelectEnd]);

    //Window events
    useEvent(window, "mousemove", useCallback(e => {
        if (!dragSelectionRef.started) return;

        updateSelectionRect([e.clientX, e.clientY])
    }, [updateSelectionRect]));

    useEvent(window, "touchmove", useCallback(e => {
        if (!dragSelectionRef.started) return;
        e.preventDefault();

        const touch = e.touches[0];
        updateSelectionRect([touch.clientX, touch.clientY]);
    }, [updateSelectionRect]), false);

    useEvent(window, "mouseup", handleDragEnd);
    useEvent(window, "touchend", handleDragEnd);

    //#endregion

    //Set props
    Object.assign(resizingProps,{
        bodyContainerRef,
        tableBodyRef,
        selectionRectRef,
        dragSelectStart,
        setMode
    });

    return <div
        className="rst-scrollingContainer"
        onScroll={handleScroll}
    >
        {!!mode && <CursorOverlay mode={mode} />}
        <ResizingContainer {...resizingProps} />
    </div>
}

export default React.memo(ScrollingContainer);
