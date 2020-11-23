import _ from "lodash";
import React, {useCallback} from 'react';
import styles from "../index.scss";
import { connect } from "react-redux";
import { makeGetPaginatedItems } from "../selectors/paginationSelectors";
import { getTableSlice } from "../utils/reduxUtils";
import classNames from "classnames";

function Body({
    columns,
    name,
    options,
    items,
    tableBodyRef,
    selection,
    activeValue,
    dispatchers
}) {
    const handleRowSelect = useCallback((e, value) => {
        if (e.button !== 0) return;
        dispatchers.selectRow(value, e.ctrlKey, e.shiftKey);
    }, [dispatchers]);

    const handleRowContextMenu = useCallback((e, value) => {
        dispatchers.contextMenu(value, e.ctrlKey);
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

    const renderRow = (row) => {
        const value = row[options.valueProperty];

        const classes = {
            [styles.selected]: selection.has(value),
            [styles.active]: activeValue === value
        };

        return <tr
            key={`row_${name}_${value}`}
            className={classNames(classes, row._className)}
            onContextMenu={e => handleRowContextMenu(e, value)}
            onMouseDown={e => handleRowSelect(e, value)}
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
        const slice = getTableSlice(root, props.namespace);
        const picked = _.pick(slice,
            "tableItems",
            "selection",
            "activeValue"
        );

        return {
            ...picked,
            items: getItems(slice)
        }
    }
}

export default connect(makeMapState)(Body);
