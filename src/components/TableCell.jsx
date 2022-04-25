import _ from "lodash";
import React from "react";

function TableCell({ render, data, index, path, isHeader }) {
    const options = {
        className: null
    };

    const defaultContent = _.get(data, path, index);
    const content = render(defaultContent, data, options);

    const CellType = isHeader ? 'th' : 'td';
    return <CellType className={options.className}>{content}</CellType>
}

export default React.memo(TableCell);
