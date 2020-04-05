import _ from "lodash";
import React from 'react';
import { connect } from "react-redux";
import { selectItem } from "../store/table";

const Body = ({
    columns,
    name,
    valueProperty,
    items,
    selectedValues,
    activeValue,
    selectItem
}) => {
    const handleRowSelect = (e, value) => {
        selectItem(value, e.ctrlKey, e.shiftKey);
        e.stopPropagation();
    }

    const renderRow = row => {
        const value = row[valueProperty];

        const classes = [];
        if (selectedValues.includes(value))
            classes.push("selected");
        if (activeValue === value)
            classes.push("active");
        if (row.classes)
            classes.push(...row.classes);

        return <tr key={`tr_${name}_${value}`}
            className={classes.join(' ')}
            onMouseDown={e => handleRowSelect(e, value)}>
            {columns.map(col => renderColumn(row, col))}
        </tr>
    }

    const renderColumn = (row, column) => {
        const value = row[valueProperty];
        const { props, path, render } = column;

        let content = null;
        if (path && render)
            content = render(row[path], row);
        else if (render)
            content = render(row);
        else if (path)
            content = row[path];

        return <td key={`td_${name}_${value}_${props.id}`}>
            {content}
        </td>
    }

    return <tbody>
        {items.map(renderRow)}
    </tbody>;
}

function mapStateToProps(state) {
    return {
        items: state.tableItems,
        selectedValues: state.selectedValues,
        activeValue: state.activeValue
    };
}


export default connect(mapStateToProps, {
    selectItem
})(Body);