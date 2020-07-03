import React, { useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import styles from "../index.scss";
import SortIcon from './SortIcon';
import { makeGetStateSlice } from '../selectors/namespaceSelectors';
import useEvent from '../hooks/useEventListener';
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
    const [resizingIndex, setResizingIndex] = useState(null);
    const header = useRef();

    const updateWidth = useCallback(xPos => {
        if (resizingIndex === null) return false;

        const head = header.current;
        const headXPos = head.getBoundingClientRect().x;
        const absX = xPos - headXPos;

        const fullWidth = _.sum(columnWidth);
        const absPercent = absX * fullWidth / head.clientWidth;
        const offset = _.sum(_.take(columnWidth, resizingIndex));
        const percent = absPercent - offset;

        actions.setColumnWidth(resizingIndex, percent);
        return true;
    }, [resizingIndex, columnWidth, actions]);

    const endResize = useCallback(() => {
        if (resizingIndex === null) return false;

        setResizingIndex(null);
        onResizeEnd(columnWidth);
        return true;
    }, [onResizeEnd, columnWidth, resizingIndex])

    useEvent(window, "mousemove", useCallback(e =>
        updateWidth(e.clientX), [updateWidth]));

    useEvent(window, "mouseup", useCallback(() =>
        endResize(), [endResize]));

    useEvent(window, "touchmove", useCallback(e => {
        if (updateWidth(e.touches[0].clientX)){
            e.preventDefault();
            e.stopPropagation();
        }
    }, [updateWidth]));

    useEvent(window, "touchend", useCallback(e => {
        if (endResize()) e.stopPropagation();
    }, [endResize]));

    return (
        <thead
            ref={header}
            data-resizing={boolAttrib(resizingIndex)}
        >
            <tr>
                {columns.map((col, index) => {
                    const { path, meta, title } = col;

                    const startResize = () => setResizingIndex(index);

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
        getSlice(root, props.namespace),
        "columnWidth",
        "sortBy"
    );
}

export default connect(makeMapState)(Head);
