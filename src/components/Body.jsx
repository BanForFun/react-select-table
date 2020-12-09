import _ from "lodash";
import React, {useCallback} from 'react';
import styles from "../index.scss";
import {connect} from "react-redux";
import classNames from "classnames";

function TableBody({
    columns,
    name,
    options,
    rows,
    topIndex,
    tableBodyRef,
    selection,
    activeIndex,
    dispatchers
}) {
    const handleRowSelect = useCallback((e, index) => {
        if (e.button !== 0) return;
        dispatchers.select(index, e.ctrlKey, e.shiftKey);
    }, [dispatchers]);

    const handleRowContextMenu = useCallback((e, index) => {
        dispatchers.contextMenu(index, e.ctrlKey);
    }, [dispatchers]);

    const renderColumn = (row, column) => {
        const rowValue = row[options.valueProperty];
        const { _id, path, render, className, isHeader } = column;

        const value = _.get(row, path);
        const content = render ? render(value, row) : value;

        const props = {
            key: `body_${name}_${rowValue}_${_id}`,
            className
        }
        if (isHeader) return <th {...props}>{content}</th>;
        return <td {...props}>{content}</td>
    };

    const renderRow = (row, rowIndex) => {
        const index = rowIndex + topIndex;
        const value = row[options.valueProperty];

        const classes = {
            [styles.selected]: selection.has(value),
            [styles.active]: activeIndex === index
        };

        return <tr
            key={`row_${name}_${value}`}
            className={classNames(classes, row._className)}
            onContextMenu={e => handleRowContextMenu(e, index)}
            onMouseDown={e => handleRowSelect(e, index)}
        >
            {columns.map(col => renderColumn(row, col))}
        </tr>
    };

    return <tbody ref={tableBodyRef}>
        {rows.map(renderRow)}
    </tbody>;
}

function mapState(root, props) {
    const {utils} = props.options;
    const state = utils.getStateSlice(root);

    const topIndex = utils.getTopIndex(state);
    const rows = utils.getPaginatedItems(state);

    return {
        ..._.pick(state,
            "selection",
            "activeIndex"
        ),
        rows,
        topIndex
    }
}

export default connect(mapState)(TableBody);
