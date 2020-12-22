import React, {useState, useCallback} from 'react';
import useEvent from "../hooks/useEvent";
import TableHeader from "./TableHeader";

function TableHead({
    columns,
    name,
    options,
    options: {utils},
    ...commonHeaderProps
}) {
    //Redux state
    const sortBy = utils.useSelector(s => s.sortBy);

    const [resizing, setResizing] = useState(null);

    useEvent(document, "mouseup", useCallback(() =>
        setResizing(null), []));

    const renderHeader = (column, index) => {
        const { _id, path, title } = column;

        const headerProps = {
            ...commonHeaderProps,
            setResizing,
            key: `header_${name}_${_id}`,
            addSeparator: options.scrollX || index < columns.length - 1,
            path, title, index,
            sortOrder: sortBy[path]
        }

        return <TableHeader {...headerProps} />
    }

    return <thead data-resizing={resizing}>
        <tr>{columns.map(renderHeader)}</tr>
    </thead>
}

export default React.memo(TableHead);
