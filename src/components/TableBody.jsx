import React from 'react';
import TableRow from "./TableRow";

//Child of BodyContainer
function TableBody(props) {
    const {
        tableBodyRef,
        ...rowCommonProps
    } = props;

    const {
        table: { utils }
    } = props;

    const rows = utils.useSelector(s => s.rows);
    const selection = utils.useSelector(s => s.selection);
    const activeValue = utils.useSelector(s => s.activeValue);

    const renderRow = (row, index) => {
        const value = utils.getRowValue(row);
        const active = value === activeValue;

        if (active)
            tableBodyRef.activeIndex = index;

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            data: row,
            selected: selection.has(value),
            index, value, active
        };

        return <TableRow {...rowProps} />;
    };

    return <tbody ref={el => tableBodyRef.element = el}>
        {rows.map(renderRow)}
    </tbody>;
}

export default React.memo(TableBody);
