import React, {useCallback, useRef} from 'react';
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";
import useEvent from "../hooks/useEvent";

//Child of ResizingContainer
function BodyContainer(props) {
    const {
        onItemsOpen,
        tableClass,
        selectionRectRef,
        placeholder,
        ...bodyProps
    } = props;

    const {
        table: { utils, selectors },
        actions,
        dragSelectStart,
        bodyContainerRef
    } = props;

    const isTouchingRef = useRef(false);

    const getSelectionArg = utils.useSelectorGetter(selectors.getSelectionArg);

    const noSelection = utils.useSelector(s => !s.selection.size);

    const handleMouseDown = useCallback(e => {
        //Checking currentTarget instead of stopping propagation at rows for two reasons:
        //- Weird chrome bug that doesn't fire a mousedown event on the row, when clicking in an area where its children are clipped
        //- To not have to also stop the propagation on the placeholder container
        if (e.currentTarget !== e.target) return;
        if (e.button !== 0) return;

        actions.clearSelection(e);
        dragSelectStart([e.clientX, e.clientY]);
    }, [dragSelectStart, actions]);

    const handleContextMenu = useCallback(e => {
        if (e.currentTarget !== e.target) return;

        if (isTouchingRef.current)
            dragSelectStart([e.clientX, e.clientY]);
        else
            actions.clearSelection(e);
    }, [dragSelectStart, actions]);

    const handleDoubleClick = useCallback(() => {
        if (noSelection) return;
        onItemsOpen(getSelectionArg(), false);
    }, [onItemsOpen, getSelectionArg, noSelection]);

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
        onTouchStart={() => isTouchingRef.current = true}
    >
        <div className="rst-dragSelection" ref={selectionRectRef} />
        {placeholder || <table className={tableClass}>
            <ColumnGroup id="body" />
            <TableBody {...bodyProps} />
        </table>}
    </div>
}

export default React.memo(BodyContainer);
