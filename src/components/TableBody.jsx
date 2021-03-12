import _ from "lodash";
import React, {useCallback, useRef, useEffect, useImperativeHandle, useMemo} from 'react';
import TableRow from "./TableRow";

function TableBody(props, ref) {
    const {
        storage: { options, utils },
        bodyContainerRef,

        ...rowCommonProps
    } = props;

    const rows = utils.useSelector(utils.getPaginatedItems);
    const visibleRange = utils.useSelector(utils.getVisibleRange);
    const selection = utils.useSelector(s => s.selection);
    const activeIndex = utils.useSelector(s => s.activeIndex);

    const rowCount = rows.length;

    const tbodyRef = useRef();

    const scheduledScroll = useRef(null);

    const scrollToIndex = useCallback(itemIndex => {
        //Check row index
        const rowIndex = itemIndex - visibleRange.start;
        if (!_.inRange(rowIndex, rowCount))
            return scheduledScroll.current = itemIndex;

        //Get elements
        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const row = tbodyRef.current.children[rowIndex];

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
    }, [visibleRange, rowCount]);

    useEffect(() => {
        const index = scheduledScroll.current;
        if (index === null) return;
        scheduledScroll.current = null;

        scrollToIndex(index);
    }, [scrollToIndex]);

    useImperativeHandle(ref, () => ({
        scrollToIndex,
        element: tbodyRef.current
    }));

    // const noneActive = useMemo(() =>
    //     !visibleRange.includes(activeIndex),
    //     [visibleRange, activeIndex]
    // );

    const renderRow = (item, rowIndex) => {
        const index = rowIndex + visibleRange.start;
        const value = item[options.valueProperty];

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${value}`,
            item, index, value,
            selected: selection.has(value),
            active: activeIndex === index
        };

        return <TableRow {...rowProps} />;
    };

    return <tbody ref={tbodyRef}>
        {rows.map(renderRow)}
    </tbody>;
}

export default React.memo(React.forwardRef(TableBody));
