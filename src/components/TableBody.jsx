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
    const virtualActiveValue = utils.useSelector(s => s.virtualActiveValue);

    const renderRow = (item, index) => {
        const value = item[options.valueProperty];

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            item, index, value,
            selected: selection.has(value),
            active: value === virtualActiveValue
        };

        return <TableRow {...rowProps} />;
    };

    return <tbody ref={tableBodyRef}>
        {rows.map(renderRow)}
    </tbody>;
}

export default React.memo(TableBody);
