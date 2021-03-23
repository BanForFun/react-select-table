import React, {useEffect} from 'react';
import TableRow from "./TableRow";

//Child of BodyContainer
function TableBody(props) {
    const {
        storage: { options, utils, selectors },
        bodyContainerRef,
        tableBodyRef,
        isSelecting,

        ...rowCommonProps
    } = props;

    const rows = utils.useSelector(selectors.getPaginatedItems);
    const startIndex = utils.useSelector(s => selectors.getVisibleRange(s).start);
    const selection = utils.useSelector(s => s.selection);
    const virtualActiveIndex = utils.useSelector(s => s.virtualActiveIndex);

    useEffect(() => {
        if (isSelecting.current) return;
        const rowIndex = virtualActiveIndex - startIndex;

        //Get elements
        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const row = tableBodyRef.current.children[rowIndex];

        //Scroll up
        const scrollUp = row.offsetTop < root.scrollTop;
        if (scrollUp)
            root.scrollTop = row.offsetTop;

        //Scroll down
        const visibleHeight = root.offsetHeight - body.offsetTop;
        const rowBottom = row.offsetTop + row.offsetHeight;
        const scrollDown = rowBottom > (root.scrollTop + visibleHeight);
        if (scrollDown)
            root.scrollTop = rowBottom - visibleHeight;
    }, [virtualActiveIndex]);

    const renderRow = (item, rowIndex) => {
        const index = rowIndex + startIndex;
        const value = item[options.valueProperty];

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            item, index, value,
            selected: selection.has(value),
            active: virtualActiveIndex === index
        };

        return <TableRow {...rowProps} />;
    };

    return <tbody ref={tableBodyRef}>
        {rows.map(renderRow)}
    </tbody>;
}

export default React.memo(TableBody);
