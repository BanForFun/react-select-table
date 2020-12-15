import styles from "../index.scss";

import _ from "lodash";
import React, {useCallback, useRef} from 'react';
import classNames from "classnames";
import useWindowEvent from "../hooks/useWindowEvent";

function TableBody({
    columns,
    name,
    options,
    rows,
    startIndex,
    tableBodyRef,
    selection,
    activeIndex,
    dispatchers
}) {
    const touchingIndex = useRef();

    const handleRowSelect = useCallback((e, index) => {
        if (e.button !== 0) return;
        dispatchers.select(index, e.ctrlKey, e.shiftKey);
    }, [dispatchers]);

    const handleRowContextMenu = useCallback((e, index) => {
        if (index === touchingIndex.current)
            dispatchers.select(index, true);
        else
            dispatchers.contextMenu(index, e.ctrlKey);
    }, [dispatchers]);

    useWindowEvent("touchend", useCallback(() => {
        touchingIndex.current = null;
    }, []));

    const renderColumn = (row, column) => {
        const { _id, path, render, className, isHeader } = column;

        const content = _.get(row, path);
        const rowValue = row[options.valueProperty];

        const Cell = isHeader ? 'th' : 'td';

        return <Cell
          key={`cell_${name}_${rowValue}_${_id}`}
          className={className}
        >{render(content, row)}</Cell>
    };

    const renderRow = (row, rowIndex) => {
        const index = rowIndex + startIndex;
        const value = row[options.valueProperty];

        const classes = {
            [styles.selected]: selection.has(value),
            [styles.active]: activeIndex === index
        };

        return <tr
            key={`row_${name}_${value}`}
            className={classNames(classes, row._className)}
            onContextMenu={e => handleRowContextMenu(e, index)}
            onMouseDown={e => handleRowSelect(e, index)}
            onTouchStart={() => touchingIndex.current = index}
        >
            {columns.map(col => renderColumn(row, col))}
        </tr>
    };

    return <tbody ref={tableBodyRef}>
        {rows.map(renderRow)}
    </tbody>;
}

export default TableBody;
