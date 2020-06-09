import React, { useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import styles from "../index.scss";
import SortIcon from './SortIcon';
import { makeGetStateSlice } from '../selectors/namespaceSelectors';
import { touchToMouseEvent } from '../utils/eventUtils';
import useEvent from '../hooks/useEvent';
import { boolAttrib } from '../utils/attributeUtils';

function Head({
    columns,
    name,
    columnWidth,
    sortBy,
    actions,
    options
}) {
    const [resizingIndex, setResizingIndex] = useState(null);
    const header = useRef();

    const handleMouseMove = useCallback(e => {
        if (resizingIndex === null) return;
        const head = header.current;
        const headXPos = head.getBoundingClientRect().x;
        const absX = e.clientX - headXPos;

        const fullWidth = _.sum(columnWidth);
        const absPercent = absX * fullWidth / head.clientWidth;
        const offset = _.sum(_.take(columnWidth, resizingIndex));
        const percent = absPercent - offset;

        actions.setColumnWidth(resizingIndex, percent);
    }, [resizingIndex, columnWidth, actions]);
    useEvent(window, "mousemove", handleMouseMove);

    const handleTouchMove = useCallback(e => {
        if (resizingIndex === null) return;
        touchToMouseEvent(e, true);
        handleMouseMove(e);
    }, [handleMouseMove, resizingIndex]);
    useEvent(window, "touchmove", handleTouchMove, { passive: false })

    const handleMouseUp = useCallback(() => {
        if (resizingIndex === null) return;
        setResizingIndex(null);
    }, [resizingIndex]);
    useEvent(window, "mouseup", handleMouseUp);

    const handleTouchEnd = useCallback(e => {
        if (resizingIndex === null) return;
        handleMouseUp();
        e.stopPropagation();
    }, [handleMouseUp, resizingIndex]);
    useEvent(window, "touchend", handleTouchEnd)

    return (
        <thead
            ref={header}
            data-resizing={boolAttrib(resizingIndex)}
        >
            <tr>
                {columns.map((col, index) => {
                    const { path, meta, title } = col;

                    const startResize = () =>
                        setResizingIndex(index);

                    const handleClick = e => {
                        if (!path) return;
                        actions.sortBy(path, e.shiftKey);
                    }

                    const addSeperator = options.scrollX ||
                        index < columns.length - 1;

                    return <th key={`head_${name}_${meta.id}`}
                        data-sortable={boolAttrib(path)}
                        data-order={sortBy[path]}
                        onClick={handleClick}>
                        {title} <SortIcon />
                        {addSeperator && <div
                            className={styles.seperator}
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
        getSlice(root, props),
        "columnWidth",
        "sortBy"
    );
}

export default connect(makeMapState)(Head);