import _ from "lodash";
import React, {Fragment, useCallback, useRef, useState} from 'react';
import useEvent from "../hooks/useEvent";
import ResizingContainer from "./ResizingContainer";
import {ActiveClass, SelectedClass} from "./TableRow";

const px = n => `${n}px`;

//Child of Root
function ScrollingContainer(props) {
    const {
        showSelectionRect,
        dragSelectionScrollFactor: scrollFactor,
        ...resizingProps
    } = props;

    const {
        utils: { options, hooks, selectors },
        actions,
        setMode
    } = props;

    const rowValues = hooks.useSelector(s => s.rowValues);
    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);

    //#region Drag selection

    //Element refs
    const tableBodyRef = useRef();
    const selectionRectRef = useRef();
    const bodyContainerRef = useRef();
    const scrollingContainerRef = useRef();

    //Variables refs
    const selection = useRef({
        enabled: false
    }).current;

    const applyRectStyles = useCallback(styles => {
        Object.assign(selectionRectRef.current.style, styles);
    }, [selectionRectRef]);

    const getRelX = useCallback((absX, inset = 0) => {
        const container = scrollingContainerRef.current;
        const { left, width } = container.getBoundingClientRect();

        return _.clamp(absX - left, inset, width) - inset + container.scrollLeft
    }, [scrollingContainerRef]);

    const getRelY = useCallback((absY, inset = 0) => {
        const container = scrollingContainerRef.current;
        const { top, height } = container.getBoundingClientRect();

        return _.clamp(absY - top, inset, height) - inset + container.scrollTop
    }, [scrollingContainerRef])

    const getScrollLeftOffset = useCallback((absX, scrollFactor, inset = 0) => {
        const bounds = scrollingContainerRef.current.getBoundingClientRect();

        const offset =
            Math.min(0, absX - bounds.left - inset) +
            Math.max(0, absX - bounds.right)

        return offset * scrollFactor;
    }, []);

    const getScrollTopOffset = useCallback((absY, scrollFactor, inset = 0) => {
        const bounds = scrollingContainerRef.current.getBoundingClientRect();

        const offset =
            Math.min(0, absY - bounds.top - inset) +
            Math.max(0, absY - bounds.bottom)

        return offset * scrollFactor;
    }, []);

    const getOffsetRelX = useCallback((absX, offset, inset = 0) => {
        const { scrollWidth } = scrollingContainerRef.current;
        const relX = getRelX(absX, inset);

        return _.clamp(relX + offset, 0, scrollWidth - inset);
    }, [getRelX]);

    const getOffsetRelY = useCallback((absY, offset, inset = 0) => {
        const { scrollHeight } = scrollingContainerRef.current;
        const relY = getRelY(absY, inset);

        return _.clamp(relY + offset, 0, scrollHeight - inset);
    }, [getRelY]);

    //State
    const dragSelectStart = useCallback((rowIndex = null) => {
        //Return if multiSelect is disabled
        if (!options.multiSelect) return;

        //Return if below items and multiSelect listBox
        if (rowIndex === null && options.listBox) return;

        setMode("selecting");

        const { offsetLeft, offsetTop } = bodyContainerRef.current;
        const { absX, absY } = selection;
        const relX = getRelX(absX, offsetLeft);
        const relY = getRelY(absY, offsetTop);

        rowIndex ??= rowValues.length;

        Object.assign(selection, {
            enabled: true,
            selected: {},
            active: -1,
            pivot: -1,
            prevIndex: rowIndex,
            originIndex: rowIndex,
            prevRelX: relX,
            prevRelY: relY,
            originRelX: relX,
            originRelY: relY,
            pendingFrames: 0
        });
    }, [
        options, rowValues.length, selection, getRelX, getRelY,
        bodyContainerRef
    ]);

    const updateSelectionState = useCallback(() => {
        applyRectStyles({ display: "none" });

        //0 length timeout to avoid delaying the frame when called from within requestAnimationFrame
        setTimeout(() => {
            setMode(null);

            const { selected, active, pivot } = selection;
            if (active < 0) return;

            actions.setSelected(
                _.mapKeys(selected, (_, index) => rowValues[index]),
                active + indexOffset,
                pivot + indexOffset
            );
        });
    }, [applyRectStyles, actions, rowValues, indexOffset, selection]);

    const getSelectionPatch = useCallback((boundedRelY, boundedPrevRelY) => {
        const {
            offsetHeight: tableHeight,
            children: rows
        } = tableBodyRef.current;

        const { originIndex, prevIndex } = selection;
        const upwards = boundedRelY < boundedPrevRelY;
        const fallbackIndex = rows.length;
        const newlySelected = {};
        let index = prevIndex;

        while (true) {
            if (index === fallbackIndex) {
                if (boundedRelY > tableHeight) break;

                selection.pivot = rows.length - 1;
            } else {
                const row = rows[index];
                if (upwards && boundedRelY >= row.offsetTop) break;
                if (!upwards && boundedRelY <= row.offsetTop + row.offsetHeight) break;

                const abovePivot = index < originIndex;
                newlySelected[index] = index === originIndex || abovePivot === upwards;
            }

            index += upwards ? -1 : 1;
            if (index === fallbackIndex) break;

            newlySelected[index] = true;
            selection.active = index;
        }

        if (index === prevIndex) return;

        Object.assign(selection.selected, newlySelected);
        selection.prevIndex = index;

        return newlySelected;
    }, [selection, tableBodyRef]);

    const updateSelection = useCallback(() => {
        if (!selection.enabled) return false;

        const { absX, absY, prevRelX, prevRelY } = selection;

        const {
            offsetLeft: headerWidth,
            offsetTop: headerHeight
        } = bodyContainerRef.current;

        const scrollLeftOffset = getScrollLeftOffset(absX, scrollFactor, headerWidth);
        const scrollTopOffset = getScrollTopOffset(absY, scrollFactor, headerHeight);

        const relX = getOffsetRelX(absX, scrollLeftOffset, headerWidth);
        const relY = getOffsetRelY(absY, scrollTopOffset, headerHeight);

        //Update selection
        let selectionPatch;
        if (prevRelY !== relY)
            selectionPatch = getSelectionPatch(relY, prevRelY);
        else if (prevRelX === relX)
            return;

        Object.assign(selection, {
            prevRelX: relX,
            prevRelY: relY
        });

        const { originRelX, originRelY, active } = selection;

        const rectBounds = showSelectionRect && {
            left: px(Math.min(relX, originRelX)),
            top: px(Math.min(relY, originRelY)),
            width: px(Math.abs(relX - originRelX)),
            height: px(Math.abs(relY - originRelY))
        };

        selection.pendingFrames++;
        requestAnimationFrame(() => {
            if (selectionPatch) {
                const tableBody = tableBodyRef.current;
                const getClassList = index => tableBody.children[index].classList;

                const [activeRow] = tableBody.getElementsByClassName(ActiveClass);
                activeRow.classList.remove(ActiveClass);

                getClassList(active).add(ActiveClass);

                _.forEach(selectionPatch, (selected, index) => {
                    getClassList(index).toggle(SelectedClass, selected);
                });
            }

            const scrollingContainer = scrollingContainerRef.current;
            scrollingContainer.scrollLeft += scrollLeftOffset;
            scrollingContainer.scrollTop += scrollTopOffset;

            if (rectBounds) {
                applyRectStyles({ display: "block" });
                applyRectStyles(rectBounds);
            }

            if (!--selection.pendingFrames && !selection.enabled)
                //Give time for current frame to be rendered
                requestAnimationFrame(updateSelectionState);
        });
    }, [
        selection,
        applyRectStyles,
        getSelectionPatch,
        showSelectionRect,
        getScrollLeftOffset,
        getScrollTopOffset,
        getOffsetRelY,
        getOffsetRelX,
        scrollFactor,
        updateSelectionState,
        scrollingContainerRef,
        bodyContainerRef
    ]);

    //Event handlers

    const handleScroll = updateSelection;

    const dragSelectEnd = useCallback(() => {
        if (!selection.enabled)
            return setMode(null);

        selection.enabled = false;

        if (!selection.pendingFrames)
            updateSelectionState();

    }, [selection, setMode, updateSelectionState]);

    //Window events
    useEvent(window, "mousemove", useCallback(e => {
        selection.absX = e.clientX;
        selection.absY = e.clientY;

        updateSelection();
    }, [updateSelection, selection]));

    useEvent(window, "touchmove", useCallback(e => {
        const [touch] = e.touches;

        selection.absX = touch.clientX;
        selection.absY = touch.clientY;

        if (updateSelection() === false) return;
        e.preventDefault();
    }, [updateSelection, selection]), false);

    useEvent(window, "mouseup", dragSelectEnd);
    useEvent(window, "touchend", dragSelectEnd);

    //#endregion

    //Set props
    Object.assign(resizingProps,{
        bodyContainerRef,
        tableBodyRef,
        selectionRectRef,
        dragSelectStart,
        updateSelection,
        dragSelectEnd,
        selection
    });

    return <Fragment>
        <div className="rst-scrollingContainer"
             onScroll={handleScroll}
             ref={scrollingContainerRef}
        >
            <ResizingContainer {...resizingProps} />
        </div>
    </Fragment>
}

export default React.memo(ScrollingContainer);
