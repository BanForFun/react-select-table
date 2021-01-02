import React from 'react';
import TableHeader from "./TableHeader";

function TableHead(props) {
    const {
        storage: { options, utils },
        columns,
        name,
        ...commonHeaderProps
    } = props;

    //Redux state
    const sortBy = utils.useSelector(s => s.sortBy);

    const renderHeader = (column, index) => {
        const { _id, path, title } = column;

        const headerProps = {
            ...commonHeaderProps,
            key: `header_${name}_${_id}`,
            addSeparator: options.scrollX || index < columns.length - 1,
            path, title, index,
            sortOrder: sortBy[path]
        }

        return <TableHeader {...headerProps} />
    }

    return <thead>
        <tr>{columns.map(renderHeader)}</tr>
    </thead>
}

export default React.memo(TableHead);
