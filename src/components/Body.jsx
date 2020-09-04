import _ from "lodash";
import React from 'react';
import styles from "../index.scss";
import { connect } from "react-redux";
import { makeGetPaginatedItems } from "../selectors/paginationSelectors";
import { getTableSlice } from "../utils/reduxUtils";

function Body({
    columns,
    name,
    options,
    items,
    rowRefs,
    selectedValues,
    activeValue,
    dispatchActions
}) {
    const handleRowSelect = (e, value) => {
        if (e.button !== 0) return;
        dispatchActions.selectRow(value, e.ctrlKey, e.shiftKey);
    };

    const handleRowContextMenu = (e, value) => {
        dispatchActions.contextMenu(value, e.ctrlKey);
    };

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

        const classes = [];
        if (selectedValues.includes(value))
            classes.push(styles.selected);
        if (activeValue === value)
            classes.push(styles.active);
        if (row._className)
            classes.push(row._className);

        return <tr
            key={`row_${name}_${value}`}
            ref={el => rowRefs.current[index] = el}
            className={classes.join(' ')}
            onContextMenu={e => handleRowContextMenu(e, value)}
            onMouseDown={e => handleRowSelect(e, value)}
        >
            {columns.map(col => renderColumn(row, col))}
        </tr>
    };

    return <tbody>
        {items.map(renderRow)}
    </tbody>;
}

function makeMapState() {
    const getItems = makeGetPaginatedItems();

    return (root, props) => {
        const slice = getTableSlice(root, props.namespace);
        const picked = _.pick(slice,
            "tableItems",
            "selectedValues",
            "activeValue"
        );

        return {
            ...picked,
            items: getItems(slice)
        }
    }
}

export default connect(makeMapState)(Body);
