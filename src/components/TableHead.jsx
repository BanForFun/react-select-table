import React from 'react';
import TableHeader from "./TableHeader";

//Child of HeadContainer
function TableHead(props) {
    const {
        table: { options, utils },
        columns,
        name,
        theadClass,
        ...commonHeaderProps
    } = props;

    //Redux state
    const sortBy = utils.useSelector(s => s.sortBy);

    const renderHeader = (column, index) => {
        const { _id, path, title } = column;

        const headerProps = {
            ...commonHeaderProps,
            key: `header_${name}_${_id}`,
            addResizer: options.scrollX || index < columns.length - 1,
            path, title, index,
            sortOrder: sortBy[path]
        }

        return <TableHeader {...headerProps} />
    }

    return <thead className={theadClass}>
        <tr>{columns.map(renderHeader)}</tr>
    </thead>
}

export default React.memo(TableHead);
