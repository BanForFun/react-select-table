import React, {useCallback} from 'react';
import styles from "../index.scss";
import TableBody from "./TableBody";
import ColumnGroup from "./ColumnGroup";
import SelectionRect from "./SelectionRect";

function BodyContainer(props) {
    const {
        className,
        bodyContainerRef,
        dragSelectStart,
        ...bodyProps
    } = props;

    const {
        dispatchers,
        options
    } = props;

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        const belowItems = e.currentTarget === e.target;
        if (belowItems && !e.ctrlKey && !options.listBox)
            dispatchers.clearSelection();

        dragSelectStart([e.clientX, e.clientY], belowItems);
    }, [dragSelectStart, dispatchers, options]);

    return <div
        className={styles.bodyContainer}
        ref={bodyContainerRef}
        onMouseDown={handleMouseDown}
    >
        <SelectionRect bodyContainerRef={bodyContainerRef} />
        <table className={className}>
            <ColumnGroup columns={props.columns} name={props.name} />
            <TableBody {...bodyProps} />
        </table>
    </div>
}

export default React.memo(BodyContainer);
