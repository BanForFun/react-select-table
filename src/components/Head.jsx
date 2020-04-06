import React, { useEffect, useState, useRef, useCallback } from 'react';
import sortIcon from "../icons/angle-line.svg";
import _ from "lodash";
import { connect } from 'react-redux';
import { setColumnWidth, sortBy } from "../store/table";
import { registerEventListeners } from '../utils/elementUtils';

function Head({
    columns,
    name,
    columnWidth,
    sort,
    scrollBarWidth,
    setColumnWidth,
    sortBy
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

        setColumnWidth(compatibleIndex, percent);
    }, [resizingIndex, columnWidth, setColumnWidth, scrollBarWidth]);

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

    const raiseSort = path => {
        if (ignoreSort.current) {
            ignoreSort.current = false;
            return;
        }

        sortBy(path)
    }

    function renderSortIcon(colPath) {
        const { path, order } = sort;

        if (colPath !== path) return null;
        return <img className="sortIcon" src={sortIcon}
            data-order={order} />
    }

    return <thead className="header" ref={header}
        data-resizing={isResizing}>
        <tr>
            {columns.map((col, index) => {
                const { width, id } = col.props;
                const { path } = col;
                const isSortable = !col.render && !!path;

                return <th key={`title_${name}_${id}`}
                    data-sortable={isSortable}
                    onClick={() => isSortable && raiseSort(path)}
                    className="column" style={{ width }}>

                    <div className="title">
                        {col.title}
                        {isSortable && renderSortIcon(path)}
                    </div>
                    <div className="seperator"
                        onMouseDown={() => setResizingIndex(index)} />
                </th>
            })}
            {!!scrollBarWidth && <th className="scrollMargin"
                width={`${scrollBarWidth}px`} />
            }
        </tr>
    </thead>;
}

function mapStateToProps(state) {
    return _.pick(state, "columnWidth", "sort");
}

export default connect(mapStateToProps, {
    setColumnWidth, sortBy
})(Head);