import _ from "lodash";
import React, {useCallback, useRef, useEffect, useImperativeHandle} from 'react';
import useEvent from "../hooks/useEvent";
import TableRow from "./TableRow";

function TableBody(props, ref) {
    const {
        bodyContainerRef,
        options,
        options: {utils},

        ...rowCommonProps
    } = props;

    const {rows, startIndex} = utils.useSelector(utils.getPaginatedItems);
    const selection = utils.useSelector(s => s.selection);
    const activeIndex = utils.useSelector(s => s.activeIndex);

    const rowCount = rows.length;

    const tbodyRef = useRef();

    const touchingIndex = useRef();
    const scheduledScroll = useRef(null);

    useEvent(document.body,"touchend", useCallback(() => {
        touchingIndex.current = null;
    }, []));

    const scrollToIndex = useCallback(itemIndex => {
        //Check row index
        const rowIndex = itemIndex - startIndex;
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
    }, [startIndex, rowCount]);

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

    const renderRow = (item, rowIndex) => {
        const index = rowIndex + startIndex;
        const value = item[options.valueProperty];

        const rowProps = {
            ...rowCommonProps,
            touchingIndex,
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
