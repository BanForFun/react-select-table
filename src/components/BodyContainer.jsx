import React, {useCallback, useRef} from 'react';
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";
import useEvent from "../hooks/useEvent";

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
        dragSelectStart,
        bodyContainerRef
    } = props;

    const isTouchingRef = useRef(false);

    const raiseItemsOpen = hooks.useSelectorGetter(eventRaisers.itemsOpen);
    const raiseContextMenu = hooks.useSelectorGetter(eventRaisers.contextMenu);

    const noSelection = hooks.useSelector(s => !s.selection.size);

    const handleMouseDown = useCallback(e => {
        //Checking currentTarget instead of stopping propagation at rows for two reasons:
        //- Weird chrome bug that doesn't fire a mousedown event on the row, when clicking in an area where its children are clipped
        //- To not have to also stop the propagation on the placeholder container
        if (e.currentTarget !== e.target) return;
        if (e.button !== 0) return;

        actions.baseClearSelection();
        dragSelectStart([e.clientX, e.clientY]);
    }, [dragSelectStart, actions]);

    const contextMenu = useCallback(e => {
        if (options.listBox || e.shiftKey)
            raiseContextMenu(true);
        else if (e.ctrlKey)
            raiseContextMenu();
        else
            actions.baseClearSelection(true);

        if (eventRaisers.isHandlerDefined("onContextMenu"))
            e.preventDefault();
    }, [actions, options, raiseContextMenu, eventRaisers]);

    const handleContextMenu = useCallback(e => {
        if (e.currentTarget !== e.target) return;

        if (isTouchingRef.current)
            dragSelectStart([e.clientX, e.clientY]);
        else
            contextMenu(e);
    }, [dragSelectStart, contextMenu]);

    const handleDoubleClick = useCallback(() => {
        if (noSelection) return;
        raiseItemsOpen(false);
    }, [raiseItemsOpen, noSelection]);

    const handleTouchStart = useCallback(e => {
        isTouchingRef.current = true;

        if (e.currentTarget !== e.target) return;
        if (e.targetTouches.length < 2) return;
        contextMenu(e);
    }, [contextMenu]);

    useEvent(window, "touchend", useCallback(() => {
        isTouchingRef.current = false;
    }, []));

    Object.assign(bodyProps, {
        isTouchingRef
    });

    return <div
        className="rst-bodyContainer"
        ref={bodyContainerRef}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
    >
        <div className="rst-dragSelection" ref={selectionRectRef} />
        {placeholder || <table className={tableClass}>
            <ColumnGroup id="body" />
            <TableBody {...bodyProps} />
        </table>}
    </div>
}

export default React.memo(BodyContainer);
