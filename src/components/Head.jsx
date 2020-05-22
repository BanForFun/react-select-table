import React, { useEffect, useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import { registerListeners } from '../utils/eventUtils';
import styles from "../index.scss";
import SortIcon from './SortIcon';
import { makeGetStateSlice } from '../selectors/namespaceSelector';
import { touchToMouseEvent } from '../utils/eventUtils';

function Head({
    columns,
    name,
    columnWidth,
    sortOrder,
    sortPath,
    actions,
    options
}) {
    const [resizingIndex, setResizingIndex] = useState(null);
    const header = useRef();

    const onMouseMove = useCallback(e => {
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

    const onTouchMove = useCallback(e => {
        if (resizingIndex === null) return;
        touchToMouseEvent(e, true);
        onMouseMove(e);
    }, [onMouseMove, resizingIndex]);

    const onMouseUp = useCallback(() => {
        if (resizingIndex === null) return;
        setResizingIndex(null);
    }, [resizingIndex]);

    const onTouchEnd = useCallback(e => {
        if (resizingIndex === null) return;
        onMouseUp();
        e.stopPropagation();
    }, [onMouseUp, resizingIndex]);

    useEffect(() => {
        return registerListeners(window, {
            "mousemove": onMouseMove,
            "mouseup": onMouseUp,
            "touchmove": onTouchMove,
            "touchend": onTouchEnd
        }, { passive: false });
    }, [onMouseMove, onTouchMove, onTouchEnd, onMouseUp]);

    const renderSortIcon = useCallback(colPath => {
        if (colPath !== sortPath) return null;
        return <SortIcon order={sortOrder} />
    }, [sortPath, sortOrder]);

    return (
        <thead
            ref={header}
            data-resizing={resizingIndex !== null}
        >
            <tr>
                {columns.map((col, index) => {
                    const { path, meta } = col;
                    const isSortable = !!path;

                    const startResize = () =>
                        setResizingIndex(index);

                    const handleClick = () => {
                        if (!isSortable) return;
                        actions.sortBy(path);
                    }

                    const addSeperator = options.scrollX ||
                        index < columns.length - 1;

                    return <th key={`head_${name}_${meta.id}`}
                        data-sortable={isSortable}
                        onClick={handleClick}>
                        {col.title}
                        {isSortable && renderSortIcon(path)}
                        {addSeperator && <div className={styles.seperator}
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
        "sortOrder",
        "sortPath"
    );
}

export default connect(makeMapState)(Head);