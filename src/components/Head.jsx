import styles from "../index.scss";

import React, { useState, useRef, useCallback } from 'react';
import _ from "lodash";
import produce from "immer";
import AngleDownIcon from './AngleDownIcon';
import useWindowEvent from '../hooks/useWindowEvent';
import { boolAttrib } from '../utils/attributeUtils';

function TableHead({
    columns,
    sortBy,
    name,
    columnWidths,
    setColumnWidths,
    dispatchers,
    options,
    onResizeEnd
}) {
    const [resizingIndex, setResizingIndex] = useState(-1);
    const header = useRef();

    const updateWidth = useCallback(xPos => {
        if (resizingIndex < 0) return;

        const index = resizingIndex;
        const head = header.current;
        const headXPos = head.getBoundingClientRect().x;
        const absX = xPos - headXPos;

        const fullWidth = _.sum(columnWidths);
        const absWidth = absX * fullWidth / head.clientWidth;
        const offset = _.sum(_.take(columnWidths, index));
        const newWidth = absWidth - offset;

        setColumnWidths(produce(columnWidths, width => {
            const minWidth = options.minColumnWidth;

            if (options.scrollX) {
                width[index] = Math.max(newWidth, minWidth);
                return;
            }

            const thisWidth = width[index];
            const nextWidth = width[index + 1];
            const availableWidth = thisWidth + nextWidth;
            const maxWidth = availableWidth - minWidth;
            const limitedWidth = _.clamp(newWidth, minWidth, maxWidth);

            width[index] = limitedWidth;
            width[index + 1] = availableWidth - limitedWidth;
        }));
    }, [
        resizingIndex,
        columnWidths,
        setColumnWidths,
        options
    ]);

    const dragEnd = useCallback(() => {
        if (resizingIndex < 0) return;

        setResizingIndex(-1);
        onResizeEnd(columnWidths);
    }, [resizingIndex, onResizeEnd, columnWidths]);

    useWindowEvent("mousemove", useCallback(e => {
        updateWidth(e.clientX)
    },[updateWidth]));

    useWindowEvent("mouseup", dragEnd);

    useWindowEvent("touchmove", useCallback(e => {
        if (resizingIndex < 0) return;

        e.preventDefault();
        updateWidth(e.touches[0].clientX);
    }, [resizingIndex, updateWidth]), false);

    useWindowEvent("touchend", dragEnd);

    return (
        <thead ref={header} data-resizing={boolAttrib(resizingIndex >= 0)}>
            <tr>
                {columns.map((col, index) => {
                    const { _id, path, title } = col;

                    const startResize = () =>
                        setResizingIndex(index);

                    const handleClick = e => {
                        if (!path) return;
                        dispatchers.sortItems(path, e.shiftKey);
                    }

                    const addSeparator = options.scrollX ||
                        index < columns.length - 1;

                    return <th
                        key={`header_${name}_${_id}`}
                        data-sortable={boolAttrib(path)}
                        onClick={handleClick}
                    >
                        {title}
                        <AngleDownIcon
                            className={styles.sortIcon}
                            data-order={sortBy[path]}
                        />
                        {addSeparator && <div
                            className={styles.separator}
                            onClick={e => e.stopPropagation()}
                            onTouchStart={startResize}
                            onMouseDown={startResize}
                        />}
                    </th>
                })}
            </tr>
        </thead>
    );
}

export default TableHead;
