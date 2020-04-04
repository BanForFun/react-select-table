import React, { useEffect, useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import { setColumnWidth } from "../store/table";
import { registerEventListeners } from '../utils/elementUtils';

function Head({ columns, name, columnWidth, columnOrder, setColumnWidth }) {
    const orderedColumns = columnOrder.length ?
        _.sortBy(columns, col => columnOrder.indexOf(col.path)) :
        columns;

    const [resizingIndex, setResizingIndex] = useState(null);
    const header = useRef();

    const isResizing = resizingIndex !== null;

    const onMouseMove = useCallback(e => {
        if (!isResizing) return;
        const bounds = header.current.getBoundingClientRect();
        const absX = e.clientX - bounds.x;

        const absPercent = absX * 100 / bounds.width;
        const offset = _.sum(_.take(columnWidth, resizingIndex));
        const percent = absPercent - offset;

        setColumnWidth(resizingIndex, percent);
    }, [resizingIndex, columnWidth, setColumnWidth]);

    useEffect(() => {
        const dispose = registerEventListeners(document, {
            mousemove: onMouseMove,
            mouseup: () => setResizingIndex(null)
        });
        return dispose;
    }, [onMouseMove]);

    return <div className="header" ref={header}
        data-resizing={isResizing}>

        {orderedColumns.map((col, index) => {
            const id = col.key || col.path;
            const style = {
                width: `${columnWidth[index]}%`
                // "z-index": index
            };

            return <div key={`header_${name}_${id}`}
                className="column" style={style}>
                <div className="title">{col.title}</div>
                <div className="seperator"
                    onMouseDown={() => setResizingIndex(index)} />
            </div>
        })}
    </div>;
}

function mapStateToProps(state) {
    return _.pick(state, "columnWidth", "columnOrder");
}

export default connect(mapStateToProps, {
    setColumnWidth
})(Head);