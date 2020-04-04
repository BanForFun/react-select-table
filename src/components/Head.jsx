import React, { useEffect, useState, useRef, useCallback } from 'react';
import _ from "lodash";
import { connect } from 'react-redux';
import { setColumnWidth } from "../store/table";
import { registerEventListeners } from '../utils/elementUtils';

function Head({ columns, name, columnWidth, setColumnWidth }) {
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

        {columns.map((col, index) => {
            const { width, id } = col.props;

            return <div key={`header_${name}_${id}`}
                className="column" style={{ width }}>
                <div className="content">{col.title}</div>
                <div className="seperator"
                    onMouseDown={() => setResizingIndex(index)} />
            </div>
        })}
    </div>;
}

function mapStateToProps(state) {
    return _.pick(state, "columnWidth");
}

export default connect(mapStateToProps, {
    setColumnWidth
})(Head);