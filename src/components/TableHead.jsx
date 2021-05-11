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

    //Redux state
    const sortAscending = utils.useSelector(s => s.sortAscending);

    const sortPriority = useMemo(() => {
        let priority = 0;
        return _.mapValues(sortAscending,() => ++priority);
    }, [sortAscending])

    const renderHeader = (column, index) => {
        const { _id, path, title } = column;

        const headerProps = {
            ...commonHeaderProps,
            key: `header_${name}_${_id}`,
            addResizer: options.scrollX || index < columns.length - 1,
            path, title, index,
            sortAscending: sortAscending[path],
            sortPriority: sortPriority[path]
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
