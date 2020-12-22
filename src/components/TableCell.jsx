import React from 'react';

function TableCell({
    isHeader,
    item,
    content,
    render,
    className
}) {
    const Cell = isHeader ? 'th' : 'td';
    return <Cell className={className}>
        {render(content, item)}
    </Cell>
}

export default React.memo(TableCell);
