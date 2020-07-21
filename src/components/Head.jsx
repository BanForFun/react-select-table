import React, { useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import styles from "../index.scss";
import SortIcon from './SortIcon';
import { makeGetStateSlice } from '../selectors/namespaceSelectors';
import useWindowEvent from '../hooks/useWindowEvent';
import { boolAttrib } from '../utils/attributeUtils';

function Head({
    columns,
    sortBy,
    name,
    columnWidth,
    actions,
    options,
    onResizeEnd
}) {
    const isResizing = useRef(false);
    const [resizingIndex, setResizingIndex] = useState(null);
    const header = useRef();

    const updateWidth = useCallback(xPos => {
        if (resizingIndex === null) return;

        const head = header.current;
        const headXPos = head.getBoundingClientRect().x;
        const absX = xPos - headXPos;

        const fullWidth = _.sum(columnWidth);
        const absPercent = absX * fullWidth / head.clientWidth;
        const offset = _.sum(_.take(columnWidth, resizingIndex));
        const percent = absPercent - offset;

        actions.setColumnWidth(resizingIndex, percent);
    }, [resizingIndex, columnWidth, actions]);

    const dragEnd = useCallback(() => {
        if (resizingIndex === null) return;

        setResizingIndex(null);
        onResizeEnd(columnWidth);
    }, [resizingIndex, onResizeEnd, columnWidth]);

    useWindowEvent("mousemove", e => updateWidth(e.clientX));

    useWindowEvent("mouseup", dragEnd);

    useWindowEvent("touchmove", e => {
        if (resizingIndex === null) return;

        e.preventDefault();
        updateWidth(e.touches[0].clientX);
    });

    useWindowEvent("touchend", dragEnd);

    return (
        <thead
            ref={header}
            data-resizing={boolAttrib(resizingIndex)}
        >
            <tr>
                {columns.map((col, index) => {
                    const { path, meta, title } = col;

                    const startResize = () => {
                        setResizingIndex(index);
                        isResizing.current = true;
                    }

                    const handleClick = e => {
                        if (!path) return;
                        actions.sortBy(path, e.shiftKey);
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
                            onMouseDown={startResize} />}
                    </th>
                })}
            </tr>
        </thead>
    );
}

function makeMapState() {
    const getSlice = makeGetStateSlice();

    return (root, props) => _.pick(
        getSlice(root, props.namespace),
        "columnWidth",
        "sortBy"
    );
}

export default connect(makeMapState)(Head);
