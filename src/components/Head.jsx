import React, { useEffect, useState, useRef, useCallback } from 'react';
import sortIcon from "../icons/angle-line.svg";
import _ from "lodash";
import { connect } from 'react-redux';
import { setColumnWidth, sortBy } from "../store/table";
import { registerEventListeners } from '../utils/elementUtils';

function Head({ columns, name, columnWidth, sort,
    setColumnWidth, sortBy }) {

    const [resizingIndex, setResizingIndex] = useState(null);
    const header = useRef();

    const isResizing = resizingIndex !== null;

    const onMouseMove = useCallback(e => {
        if (!isResizing) return;
        const compatibleIndex = resizingIndex - 1;
        const bounds = header.current.getBoundingClientRect();
        const absX = e.clientX - bounds.x;

        const absPercent = absX * 100 / bounds.width;
        const offset = _.sum(_.take(columnWidth, compatibleIndex));
        const percent = absPercent - offset;

        setColumnWidth(compatibleIndex, percent);
    }, [resizingIndex, columnWidth, setColumnWidth]);

    useEffect(() => {
        const dispose = registerEventListeners(document, {
            mousemove: onMouseMove,
            mouseup: () => setResizingIndex(null)
        });
        return dispose;
    }, [onMouseMove]);

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
                    onClick={() => isSortable && sortBy(path)}
                    className="column" style={{ width }}>

                    <div className="title">
                        {col.title}
                        {isSortable && renderSortIcon(path)}
                    </div>
                    <div className="seperator"
                        onMouseDown={() => setResizingIndex(index)} />
                </th>
            })}
        </tr>
    </thead>;
}

function mapStateToProps(state) {
    return _.pick(state, "columnWidth", "sort");
}

export default connect(mapStateToProps, {
    setColumnWidth, sortBy
})(Head);