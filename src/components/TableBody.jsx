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
        utils: { hooks }
    } = props;

    const sortedItems = hooks.useSelector(s => s.sortedItems);
    const rowValues = hooks.useSelector(s => s.rowValues);
    const selection = hooks.useSelector(s => s.selection);
    const activeIndex = hooks.useSelector(s => s.activeIndex);

    const renderRow = (value, index) => {
        const active = index === activeIndex;
        const { data } = sortedItems[value];

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            data, index, value, active,
            selected: selection.has(value),
            className: getRowClassName(data)
        };

        return <TableRow {...rowProps} />;
    };

    return <tbody ref={tableBodyRef}>
        {rowValues.map(renderRow)}
    </tbody>;
}

export default React.memo(TableBody);
