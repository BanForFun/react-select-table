import _ from "lodash";
import React, {useCallback} from 'react';
import styles from "../index.scss";
import {connect} from "react-redux";
import { makeGetPaginatedItems } from "../selectors/paginationSelectors";
import classNames from "classnames";
import {getTableSlice} from "../utils/optionUtils";

function TableBody({
    columns,
    name,
    options,
    items,
    tableBodyRef,
    selection,
    activeIndex,
    dispatchers
}) {
    const handleRowSelect = useCallback((e, index) => {
        if (e.button !== 0) return;
        dispatchers.selectRow(index, e.ctrlKey, e.shiftKey);
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

    const renderRow = (row, index) => {
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
        {items.map(renderRow)}
    </tbody>;
}

function makeMapState() {
    const getItems = makeGetPaginatedItems();

    return (root, props) => {
        const slice = getTableSlice(root, props.ns);

        return {
            ..._.pick(slice,
                "tableItems",
                "selection",
                "activeIndex"
            ),
            items: getItems(slice)
        }
    }
}

export default connect(makeMapState)(TableBody);
