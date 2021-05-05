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
    const sortPath = utils.useSelector(s => s.sortPath);
    const sortAscending = utils.useSelector(s => s.sortAscending)

    const renderHeader = (column, index) => {
        const { _id, path, title } = column;

        const headerProps = {
            ...commonHeaderProps,
            key: `header_${name}_${_id}`,
            addResizer: options.scrollX || index < columns.length - 1,
            path, title, index,
            sortAscending: sortPath !== path ? null : sortAscending
        }

        return <TableHeader {...headerProps} />
    }

    return <thead className={theadClass}>
        <tr>
            {columns.map(renderHeader)}
            <td/>
        </tr>
    </thead>
}

export default React.memo(TableHead);
