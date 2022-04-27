import _ from "lodash";
import React from "react";
import classNames from "classnames";

function TableCell({ render, rowData, rowIndex, path, isHeader }) {
    const options = {
        className: null
    };

    const defaultContent = _.get(rowData, path, rowIndex);
    const content = render(defaultContent, rowData, options);
    const className = classNames(options.className, isHeader ? "rst-header" : "rst-cell");

    return <td className={className}>{content}</td>
}

export default React.memo(TableCell);
