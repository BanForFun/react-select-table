import React, {useCallback, useLayoutEffect, useRef} from 'react';
import _ from "lodash";
import classNames from "classnames";

export const ActiveClass = "is-active";
export const SelectedClass = "is-selected";

//Child of TableBody
function TableRow({
    columns,
    name,
    actions,
    isTouchingRef,
    dragSelectStart,
    selected,
    active,
    data,
    value,
    index,
    bodyContainerRef,
    className,
    utils: { hooks }
}) {
    const trRef = useRef();
    const visibleItemCount = hooks.useSelector(s => s.visibleItemCount);

    useLayoutEffect(() => {
        if (!active) return;

        //Get elements
        const bodyContainer = bodyContainerRef.current;
        const scrollingContainer = bodyContainer.offsetParent;
        const tr = trRef.current;

        //Scroll up
        const scrollUp = tr.offsetTop < scrollingContainer.scrollTop;
        if (scrollUp)
            scrollingContainer.scrollTop = tr.offsetTop;

        //Scroll down
        const visibleHeight = scrollingContainer.clientHeight - bodyContainer.offsetTop;
        const rowBottom = tr.offsetTop + tr.offsetHeight;
        const scrollDown = rowBottom > (scrollingContainer.scrollTop + visibleHeight);
        if (scrollDown)
            scrollingContainer.scrollTop = rowBottom - visibleHeight;

        //visibleItemCount is a dependency so that when items are added or removed, the active row stays visible
    }, [active, visibleItemCount]);

    const handleContextMenu = useCallback(e => {
        if (isTouchingRef.current) {
            actions.baseSelect(index, true, false);
            dragSelectStart([e.clientX, e.clientY], index);
        } else {
            actions.select(e, index);
        }
    }, [index, actions]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;

        actions.select(e, index);
        dragSelectStart([e.clientX, e.clientY], index);
    }, [index, actions]);

    const renderColumn = (column) => {
        const { _id, path, render, isHeader } = column;

        const options = {
            className: null
        };
        const defaultContent = _.getOrSource(data, path);
        const content = render(defaultContent, data, options);

        const CellType = isHeader ? 'th' : 'td';
        return <CellType
            key={`cell_${name}_${value}_${_id}`}
            className={options.className}
        >{content}</CellType>
    };

    const trClass = classNames(className, {
        [SelectedClass]: selected,
        [ActiveClass]: active
    });

    return <tr
        className={trClass}
        ref={trRef}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
    >
        {columns.map(renderColumn)}
        <td/>
    </tr>;
}

export default React.memo(TableRow);
