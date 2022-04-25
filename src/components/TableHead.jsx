import React, {Fragment, useMemo, useCallback} from 'react';
import TableHeader from "./TableHeader";
import {DragModes} from "../utils/tableUtils";

//Child of HeadContainer
function TableHead(props) {
    const {
        columns,
        name,
        dragMode,
        ...commonHeaderProps
    } = props;

    const {
        columnResizeStart,
        utils: { hooks, options }
    } = props;

    const sortAscending = hooks.useSelector(s => s.sortAscending);

    const sorting = useMemo(() => {
        const orders = {}

        let index = 0;
        for (const [path, ascending] of sortAscending)
            orders[path] = { ascending, priority: ++index }

        return { orders, maxIndex: index };
    }, [sortAscending])

    //Redux state

    const getHeaderProps = (column, index) => {
        const { _id, path, title } = column;
        const sortOrder = sorting.orders[path];

        return {
            ...commonHeaderProps,
            key: `header_${name}_${_id}`,
            path, title, index,
            isResizable: !options.constantWidth || index < columns.length - 1,
            isResizing: dragMode?.name === DragModes.Resize && dragMode.index === index,
            sortAscending: sortOrder?.ascending,
            sortPriority: sortOrder?.priority,
            showPriority: sorting.maxIndex > 1
        }
    }

    const handleSpacerPointerDown = useCallback(e => {
        columnResizeStart(e.clientX, e.clientY, e.pointerId, columns.length - 1);
    }, [columnResizeStart, columns]);

    return <thead>
        <tr>
            {columns.map((col, idx) =>
                <TableHeader {...getHeaderProps(col, idx)}/>)}

            <th className="rst-spacer">
                <div className="rst-columnSeparator"/>
                {/* Second column resizer for last header, to ensure that the full column resizer width
                is visible even when the spacer is fully collapsed */}
                {!options.constantWidth && <Fragment>
                    <div className="rst-columnResizer" onPointerDown={handleSpacerPointerDown} />
                    <div className="rst-columnResizerHider"/>
                </Fragment>}
            </th>
        </tr>
    </thead>
}

export default React.memo(TableHead);
