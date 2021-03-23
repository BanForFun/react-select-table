import React, {useCallback, useRef} from 'react';
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";
import SelectionRect from "./SelectionRect";
import useEvent from "../hooks/useEvent";

//Child of ResizingContainer
function BodyContainer(props) {
    const {
        onItemsOpen,
        emptyPlaceholder,
        ...bodyProps
    } = props;

    const {
        storage: { options, utils, selectors },
        actions,
        dragSelectStart,
        bodyContainerRef
    } = props;

    const isTouching = useRef(false);

    const getSelectionArg = utils.useSelectorGetter(selectors.getSelectionArg);

    const noItems = utils.useSelector(t => !t.tableItems.length);
    const selectionSize = utils.useSelector(t => t.selection.size);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        if (!e.ctrlKey && !options.listBox)
            actions.clearSelection();

        dragSelectStart([e.clientX, e.clientY]);
    }, [dragSelectStart, actions, options]);

    const handleContextMenu = useCallback(e => {
        if (isTouching.current)
            dragSelectStart([e.clientX, e.clientY]);
        else
            actions.contextMenu(null, e.ctrlKey);
    }, [dragSelectStart, actions]);

    const handleDoubleClick = useCallback(() => {
        if (!selectionSize) return;
        onItemsOpen(getSelectionArg(), false);
    }, [onItemsOpen, getSelectionArg, selectionSize]);

    useEvent(document.body, "touchend", useCallback(() => {
        isTouching.current = false;
    }, []));

    Object.assign(bodyProps, {
        isTouching
    });

    return <div
        className="rst-bodyContainer"
        ref={bodyContainerRef}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onTouchStart={() => isTouching.current = true}
    >
        <SelectionRect bodyContainerRef={bodyContainerRef} />
        {noItems
            ? <div className="rst-bodyPlaceholder">{emptyPlaceholder}</div>
            : <table>
                <ColumnGroup columns={props.columns} name={props.name} />
                <TableBody {...bodyProps} />
            </table>
        }
    </div>
}

export default React.memo(BodyContainer);
