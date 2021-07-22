import React, {useMemo} from 'react';
import TableHeader from "./TableHeader";

//Child of HeadContainer
function TableHead(props) {
    const {
        utils: { hooks },
        columns,
        name,
        ...commonHeaderProps
    } = props;

    const sortAscending = hooks.useSelector(s => s.sortAscending);

    const sorting = useMemo(() => {
        const orders = {}

        let index = 0;
        for (let [path, ascending] of sortAscending)
            orders[path] = { ascending, priority: ++index }

        return { orders, maxIndex: index };
    }, [sortAscending])

    //Redux state

    const renderHeader = (column, index) => {
        const { _id, path, title } = column;

        const sortOrder = sorting.orders[path];

        const headerProps = {
            ...commonHeaderProps,
            key: `header_${name}_${_id}`,
            path, title, index,
            sortAscending: sortOrder?.ascending,
            sortPriority: sortOrder?.priority,
            showPriority: sorting.maxIndex > 1
        }

        return <TableHeader {...headerProps} />
    }

    return <thead>
        <tr>
            {columns.map(renderHeader)}
            <td/>
        </tr>
    </thead>
}

export default React.memo(TableHead);
