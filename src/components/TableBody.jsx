import React, {useLayoutEffect} from 'react';
import TableRow from "./TableRow";

//Child of BodyContainer
function TableBody(props) {
    const {
        tableBodyRef,
        getRowClassName,
        bodyContainerRef,
        ...rowCommonProps
    } = props;

    const {
        utils: { hooks, selectors }
    } = props;

    const sortedItems = hooks.useSelector(s => s.sortedItems);
    const rowValues = hooks.useSelector(s => s.rowValues);
    const selection = hooks.useSelector(s => s.selection);
    const visibleItemCount = hooks.useSelector(s => s.visibleItemCount);
    const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex);
    const indexOffset = hooks.useSelector(selectors.getPageIndexOffset);

    // useLayoutEffect(() => {
    //     //Get elements
    //     const activeRow = tableBodyRef.current.children[activeRowIndex];
    //     const bodyContainer = bodyContainerRef.current;
    //     const scrollingContainer = bodyContainer.offsetParent;
    //
    //     //Scroll up
    //     const scrollUp = activeRow.offsetTop < scrollingContainer.scrollTop;
    //     if (scrollUp)
    //         scrollingContainer.scrollTop = activeRow.offsetTop;
    //
    //     //Scroll down
    //     const visibleHeight = scrollingContainer.clientHeight - bodyContainer.offsetTop;
    //     const rowBottom = activeRow.offsetTop + activeRow.offsetHeight;
    //     const scrollDown = rowBottom > (scrollingContainer.scrollTop + visibleHeight);
    //     if (scrollDown)
    //         scrollingContainer.scrollTop = rowBottom - visibleHeight;
    //
    // }, [visibleItemCount, activeRowIndex, bodyContainerRef, tableBodyRef]);

    const renderRow = (value, rowIndex) => {
        const { data } = sortedItems[value];

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            data, value, rowIndex, indexOffset,
            active: rowIndex === activeRowIndex,
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
