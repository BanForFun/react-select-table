import _ from "lodash";
import React from 'react';
import { connect } from "react-redux";
import { selectRow, setActiveRow, contextMenu } from "../store/table";
import styles from "../index.scss";

const Body = ({
    columns,
    name,
    valueProperty,
    items,
    rowRefs,
    selectedValues,
    activeValue,
    contextMenu,
    selectRow
}) => {
    const handleRowSelect = (e, value) => {
        if (e.button !== 0) return;
        selectRow(value, e.ctrlKey, e.shiftKey);
    }

    const handleRowContextMenu = (e, value) => {
        e.stopPropagation();
        contextMenu(value, e.ctrlKey);
    }

    const renderRow = row => {
        const value = row[valueProperty];

        const classes = [];
        if (selectedValues.includes(value))
            classes.push(styles.selected);
        if (activeValue === value)
            classes.push(styles.active);
        if (row.classNames)
            classes.push(...row.classNames);

        return <tr key={`tr_${name}_${value}`}
            ref={rowRefs[value]}
            className={classes.join(' ')}
            onContextMenu={e => handleRowContextMenu(e, value)}
            onMouseDown={e => handleRowSelect(e, value)}>
            {columns.map(col => renderColumn(row, col))}
        </tr>
    }

    const renderColumn = (row, column) => {
        const value = row[valueProperty];
        const { props, path, render, isHeader } = column;

        let content = null;
        if (path && render)
            content = render(row[path], row);
        else if (render)
            content = render(row);
        else if (path)
            content = row[path];

        const key = `cell_${name}_${value}_${props.id}`;
        if (isHeader) return <th key={key}>{content}</th>;
        return <td key={key}>{content}</td>
    }

    return <tbody>
        {items.map(renderRow)}
    </tbody>;
}

function mapStateToProps(state) {
    return {
        items: state.tableItems,
        selectedValues: state.selectedValues,
        activeValue: state.activeValue,
        valueProperty: state.valueProperty
    };
}


export default connect(mapStateToProps, {
    selectRow, setActiveRow, contextMenu
})(Body);