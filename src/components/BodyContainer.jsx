import React, {useCallback, useRef} from 'react';
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";
import useEvent from "../hooks/useEvent";

//Child of ResizingContainer
function BodyContainer(props) {
    const {
        onItemsOpen,
        emptyPlaceholder,
        tableClass,
        selectionRectRef,
        ...bodyProps
    } = props;

    const {
        table: { options, utils, selectors },
        actions,
        dragSelectStart,
        bodyContainerRef
    } = props;

    const isTouchingRef = useRef(false);

    const getSelectionArg = utils.useSelectorGetter(selectors.getSelectionArg);

    const noItems = utils.useSelector(s => !s.visibleItemCount);
    const noSelection = utils.useSelector(s => !s.selection.size);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        if (!e.ctrlKey && !options.listBox)
            actions.clearSelection();

        dragSelectStart([e.clientX, e.clientY]);
    }, [dragSelectStart, actions, options]);

    const handleContextMenu = useCallback(e => {
        if (isTouchingRef.current)
            dragSelectStart([e.clientX, e.clientY]);
        else
            actions.contextMenu(e, null);
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
        {noItems
            ? <div className="rst-bodyPlaceholder">{emptyPlaceholder}</div>
            : <table className={tableClass}>
                <ColumnGroup id="body" />
                <TableBody {...bodyProps} />
            </table>
        }
    </div>
}

export default React.memo(BodyContainer);
