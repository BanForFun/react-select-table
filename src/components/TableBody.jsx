import React from 'react';
import TableRow from "./TableRow";

//Child of BodyContainer
function TableBody(props) {
    const {
        table: { options, utils },
        tableBodyRef,

        ...rowCommonProps
    } = props;

    const rows = utils.useSelector(s => s.rows);
    const selection = utils.useSelector(s => s.selection);
    const activeValue = utils.useSelector(s => s.activeValue);

    const renderRow = (item, index) => {
        const value = item[options.valueProperty];
        const active = value === activeValue;

        if (active)
            tableBodyRef.activeIndex = index;

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            item, index, value,
            selected: selection.has(value),
            active
        };

        return <TableRow {...rowProps} />;
    };

    return <tbody ref={el => tableBodyRef.element = el}>
        {rows.map(renderRow)}
    </tbody>;
}

export default React.memo(TableBody);
