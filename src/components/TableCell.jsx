import React from 'react';

//Child of TableRow
function TableCell({
    isHeader,
    item,
    content,
    render,
    className
}) {
    const Cell = isHeader ? 'th' : 'td';
    return <Cell
        className={className}
        scope={isHeader ? "row" : null}
    >
        {render(content, item)}
    </Cell>
}

export default React.memo(TableCell);
