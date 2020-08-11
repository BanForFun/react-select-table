import React, { useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import styles from "../index.scss";
import SortIcon from './SortIcon';
import useWindowEvent from '../hooks/useWindowEvent';
import { boolAttrib } from '../utils/attributeUtils';
import {getTableSlice} from "../utils/reduxUtils";

function Head({
    columns,
    sortBy,
    name,
    columnWidth,
    dispatchActions,
    options,
    onResizeEnd
}) {
    const [resizingIndex, setResizingIndex] = useState(null);
    const header = useRef();

    const isResizing = resizingIndex !== null;

    const updateWidth = useCallback(xPos => {
        if (!isResizing) return;

        const head = header.current;
        const headXPos = head.getBoundingClientRect().x;
        const absX = xPos - headXPos;

        const fullWidth = _.sum(columnWidth);
        const absPercent = absX * fullWidth / head.clientWidth;
        const offset = _.sum(_.take(columnWidth, resizingIndex));
        const percent = absPercent - offset;

        dispatchActions.setColumnWidth(resizingIndex, percent);
    }, [resizingIndex, columnWidth, dispatchActions]);

    const dragEnd = useCallback(() => {
        if (!isResizing) return;

        setResizingIndex(null);
        onResizeEnd(columnWidth);
    }, [isResizing, onResizeEnd, columnWidth]);

    useWindowEvent("mousemove", e => updateWidth(e.clientX));

    useWindowEvent("mouseup", dragEnd);

    useWindowEvent("touchmove", e => {
        if (!isResizing) return;
        e.preventDefault();
        updateWidth(e.touches[0].clientX);
    });

    useWindowEvent("touchend", dragEnd);

    return (
        <thead ref={header} data-resizing={boolAttrib(isResizing)}>
            <tr>
                {columns.map((col, index) => {
                    const { path, meta, title } = col;

                    const startResize = () =>
                        setResizingIndex(index);

                    const handleClick = e => {
                        if (!path) return;
                        dispatchActions.sortBy(path, e.shiftKey);
                    }

                    const addSeparator = options.scrollX ||
                        index < columns.length - 1;

                    return <th key={`head_${name}_${meta.id}`}
                        data-sortable={boolAttrib(path)}
                        data-order={sortBy[path]}
                        onClick={handleClick}>
                        {title} <SortIcon />
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

function makeMapState(root, props) {
    const slice = getTableSlice(root, props.namespace)
    return _.pick(slice,
        "columnWidth",
        "sortBy"
    );
}

export default connect(makeMapState)(Head);
