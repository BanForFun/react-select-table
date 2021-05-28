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
        tableClass,
        ...bodyProps
    } = props;

    const {
        table: { options, utils, selectors },
        actions,
        dragSelectStart,
        bodyContainerRef
    } = props;

    const isTouching = useRef(false);

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
        if (isTouching.current)
            dragSelectStart([e.clientX, e.clientY]);
        else
            actions.contextMenu(null, e);
    }, [dragSelectStart, actions]);

    const handleDoubleClick = useCallback(() => {
        if (noSelection) return;
        onItemsOpen(getSelectionArg(), false);
    }, [onItemsOpen, getSelectionArg, noSelection]);

    useEvent(window, "touchend", useCallback(() => {
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
            : <table className={tableClass}>
                <ColumnGroup columns={props.columns} name={props.name} />
                <TableBody {...bodyProps} />
            </table>
        }
    </div>
}

export default React.memo(BodyContainer);
