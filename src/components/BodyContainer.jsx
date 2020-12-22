import React, {useCallback, useRef} from 'react';
import styles from "../index.scss";
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";
import SelectionRect from "./SelectionRect";
import useEvent from "../hooks/useEvent";
import {useStore} from "react-redux";

function BodyContainer(props) {
    const {
        className,
        onItemsOpen,
        tableBodyRef,
        ...bodyProps
    } = props;

    const {
        dispatchers,
        dragSelectStart,
        options,
        bodyContainerRef,
        options: {utils}
    } = props;

    const isTouching = useRef(false);

    const store = useStore();

    const handleMouseDown = useCallback(e => {
        if (!e.ctrlKey && !options.listBox)
            dispatchers.clearSelection();

        dragSelectStart([e.clientX, e.clientY]);
    }, [dragSelectStart, dispatchers, options]);

    const handleContextMenu = useCallback(e => {
        dispatchers.contextMenu(null, e.ctrlKey);

        if (!isTouching.current) return;
        dragSelectStart([e.clientX, e.clientY]);
    }, [dragSelectStart, dispatchers]);

    const handleDoubleClick = useCallback(() => {
        const slice = utils.getStateSlice(store.getState());
        onItemsOpen(utils.getSelectionArg(slice), false);
    }, [onItemsOpen, store, utils]);

    useEvent(document.body, "touchend", useCallback(() => {
        isTouching.current = false;
    }, []));

    Object.assign(bodyProps, {
        ref: tableBodyRef,
        isTouching
    });

    return <div
        className={styles.bodyContainer}
        ref={bodyContainerRef}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onTouchStart={() => isTouching.current = true}
    >
        <SelectionRect bodyContainerRef={bodyContainerRef} />
        <table className={className}>
            <ColumnGroup columns={props.columns} name={props.name} />
            <TableBody {...bodyProps} />
        </table>
    </div>
}

export default React.memo(BodyContainer);
