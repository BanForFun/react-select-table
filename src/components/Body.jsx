import _ from "lodash";
import React from 'react';
import { connect } from "react-redux";

const Body = ({ columns, name, options, items }) => {
    const { valueProperty } = options;

    const renderRow = row => {
        const value = row[valueProperty];

        return <tr key={`tr_${name}_${value}`}>
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
            <div className="content">{content}</div>
        </td>
    }

    return <tbody>
        {items.map(renderRow)}
    </tbody>;
}

function mapStateToProps(state) {
    return {
        items: state.tableItems
    };
}


export default connect(mapStateToProps)(Body);