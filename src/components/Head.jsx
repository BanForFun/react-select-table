import React, { useEffect, useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import { registerEventListeners } from '../utils/elementUtils';
import styles from "../index.scss";
import SortIcon from './SortIcon';
import { makeGetStateSlice } from '../selectors/namespaceSelector';

function Head({
    columns,
    name,
    columnWidth,
    sortOrder,
    sortPath,
    scrollBarWidth,
    actions
}) {
    const [resizingIndex, setResizingIndex] = useState(null);
    const ignoreSort = useRef(false);
    const header = useRef();

    const onMouseMove = useCallback(e => {
        if (resizingIndex === null) return;
        const compatibleIndex = resizingIndex - 1;
        const element = header.current;
        const bounds = element.getBoundingClientRect();
        const absX = e.clientX - bounds.x;

        const offsetWidth = element.clientWidth - scrollBarWidth;
        const absPercent = absX * 100 / offsetWidth;
        const offset = _.sum(_.take(columnWidth, compatibleIndex));
        const percent = absPercent - offset;

        actions.setColumnWidth(compatibleIndex, percent);
    }, [resizingIndex, columnWidth, actions, scrollBarWidth]);

    const onMouseUp = useCallback(() => {
        if (resizingIndex === null) return;
        ignoreSort.current = true;
        setResizingIndex(null);
    }, [resizingIndex]);

    useEffect(() => {
        const dispose = registerEventListeners(document, {
            mousemove: onMouseMove,
            mouseup: onMouseUp
        });
        return dispose;
    }, [onMouseMove, onMouseUp]);

    const raiseSort = useCallback(path => {
        if (ignoreSort.current) {
            ignoreSort.current = false;
            return;
        }

        actions.sortBy(path);
    }, [actions]);

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
                    const { width, id } = col.props;
                    const { path } = col;
                    const isSortable = !!path;

                    return <th key={`title_${name}_${id}`}
                        data-sortable={isSortable} style={{ width }}
                        onClick={() => isSortable && raiseSort(path)}>
                        {col.title}
                        {isSortable && renderSortIcon(path)}
                        {index > 0 && <div className={styles.seperator}
                            onMouseDown={() => setResizingIndex(index)} />}
                    </th>
                })}
                {!!scrollBarWidth && <th
                    className={styles.scrollMargin}
                    width={`${scrollBarWidth}px`} />}
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