import _ from "lodash";
import React, {useMemo} from 'react';
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

    const sortAscending = utils.useSelector(s => s.sortAscending);

    const sortOrders = useMemo(() => {
        const orders = {}

        let index = 0;
        for (let [path, ascending] of sortAscending)
            orders[path] = { ascending, priority: ++index }

        return orders;
    }, [sortAscending])

    //Redux state

    const renderHeader = (column, index) => {
        const { _id, path, title } = column;

        const sortOrder = sortOrders[path];

        const headerProps = {
            ...commonHeaderProps,
            key: `header_${name}_${_id}`,
            addResizer: options.scrollX || index < columns.length - 1,
            path, title, index,
            sortAscending: sortOrder?.ascending,
            sortPriority: sortOrder?.priority
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
