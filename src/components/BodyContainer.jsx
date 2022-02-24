import React, {useCallback, useRef} from 'react';
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";

//Child of ResizingContainer
function BodyContainer(props) {
    const {
        tableClass,
        selectionRectRef,
        placeholder,
        ...bodyProps
    } = props;

    const {
        utils: { hooks, eventRaisers, options },
        actions,
        bodyContainerRef,
        setDragSelectionOriginIndex,
    } = props;

    // const raiseItemsOpen = hooks.useSelectorGetter(eventRaisers.itemsOpen);
    // const raiseContextMenu = hooks.useSelectorGetter(eventRaisers.contextMenu);
    //
    // const noSelection = hooks.useSelector(s => !s.selection.size);

    // const startDrag = useCallback(e => {
    //     selection.absX = e.clientX;
    //     selection.absY = e.clientY;
    //     dragSelectStart();
    // }, [dragSelectStart, selection]);
    //
    // const handleMouseDown = useCallback(e => {
    //     //Checking currentTarget instead of stopping propagation at rows for two reasons:
    //     //- Weird chrome bug that doesn't fire a mousedown event on the row, when clicking in an area where its children are clipped
    //     //- To not have to also stop the propagation on the placeholder container
    //     if (e.currentTarget !== e.target) return;
    //     if (e.button !== 0) return;
    //
    //     actions.baseClearSelection();
    //     startDrag(e);
    // }, [startDrag, actions]);

    // const contextMenu = useCallback(e => {
    //     if (options.listBox || e.shiftKey)
    //         raiseContextMenu(true);
    //     else if (e.ctrlKey)
    //         raiseContextMenu();
    //     else
    //         actions.baseClearSelection(true);
    //
    //     if (eventRaisers.isHandlerDefined("onContextMenu"))
    //         e.preventDefault();
    // }, [actions, options, raiseContextMenu, eventRaisers]);
    //
    // const handleContextMenu = useCallback(e => {
    //     if (e.currentTarget !== e.target) return;
    //
    //     if (isTouchingRef.current)
    //         startDrag(e);
    //     else
    //         contextMenu(e);
    // }, [startDrag, contextMenu]);
    //
    // const handleDoubleClick = useCallback(() => {
    //     if (noSelection) return;
    //     raiseItemsOpen(false);
    // }, [raiseItemsOpen, noSelection]);
    //
    // const handleTouchStart = useCallback(e => {
    //     isTouchingRef.current = true;
    //
    //     if (e.currentTarget !== e.target) return;
    //     if (e.targetTouches.length < 2) return;
    //     contextMenu(e);
    // }, [contextMenu]);

    // useEvent(window, "touchend", useCallback(() => {
    //     isTouchingRef.current = false;
    // }, []));

    const handlePointerDown = useCallback(() => {
        setDragSelectionOriginIndex(-1)
    }, [setDragSelectionOriginIndex]);

    return <div
        className="rst-bodyContainer"
        ref={bodyContainerRef}
        onPointerDownCapture={handlePointerDown}
    >
        <div className="rst-dragSelection" ref={selectionRectRef} />

        {placeholder || <table className={tableClass}>
            <ColumnGroup />
            <TableBody {...bodyProps} />
        </table>}
    </div>
}

export default React.memo(BodyContainer);
