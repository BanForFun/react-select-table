import React from 'react';

//Child of TableRow
function TableCell({
    isHeader,
    data,
    content,
    render,
    className
}) {
    const Cell = isHeader ? 'th' : 'td';
    return <Cell
        className={className}
        scope={isHeader ? "row" : null}
    >
        {render(content, data)}
    </Cell>
}

export default React.memo(TableCell);
