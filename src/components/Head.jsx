import React, { useEffect, useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import { registerEventListeners } from '../utils/elementUtils';
import styles from "../index.scss";
import SortIcon from './SortIcon';
import { getSubState, getNamedActions } from '../selectors/namespaceSelector';
import { bindActionCreators } from 'redux';

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

    const isResizing = resizingIndex !== null;

    const onMouseMove = useCallback(e => {
        if (!isResizing) return;
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

    useEffect(() => {
        const onMouseUp = () => {
            if (!resizingIndex) return;
            ignoreSort.current = true;
            setResizingIndex(null);
        }

        const dispose = registerEventListeners(document, {
            mousemove: onMouseMove,
            mouseup: onMouseUp
        });
        return dispose;
    }, [onMouseMove]);

    const raiseSort = useCallback(path => {
        if (ignoreSort.current) {
            ignoreSort.current = false;
            return;
        }

        actions.sortBy(path);
    }, [actions]);

    function renderSortIcon(colPath) {
        if (colPath !== sortPath) return null;
        return <SortIcon order={sortOrder} />
    }

    return <thead ref={header} data-resizing={isResizing}>
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
    </thead>;
}

function mapState(root, props) {
    const state = getSubState(root, props);
    return _.pick(state, "columnWidth", "sortOrder", "sortPath");
}

function mapDispatch(dispatch, props) {
    const actions = getNamedActions(props);
    return { actions: bindActionCreators(actions, dispatch) };
}

export default connect(mapState, mapDispatch)(Head);