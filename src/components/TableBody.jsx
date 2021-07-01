import React from 'react';
import TableRow from "./TableRow";

//Child of BodyContainer
function TableBody(props) {
    const {
        tableBodyRef,
        getRowClassName,
        ...rowCommonProps
    } = props;

    const {
        table: { utils }
    } = props;

    const rows = utils.useSelector(s => s.rows);
    const selection = utils.useSelector(s => s.selection);
    const activeValue = utils.useSelector(s => s.activeValue);

    const renderRow = (data, index) => {
        const value = utils.getDataValue(data);
        const active = value === activeValue;

        if (active)
            tableBodyRef.activeIndex = index;

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            data, index, value, active,
            selected: selection.has(value),
            className: getRowClassName(data)
        };

        return <TableRow {...rowProps} />;
    };

    return <tbody ref={el => tableBodyRef.element = el}>
        {rows.map(renderRow)}
    </tbody>;
}

export default React.memo(TableBody);
