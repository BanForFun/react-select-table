import React, {useCallback, useEffect, useRef} from 'react';
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
    table: { utils }
}) {
    const trRef = useRef();
    const visibleItemCount = utils.useSelector(s => s.visibleItemCount);

    useEffect(() => {
        if (!active) return;

        //Get elements
        const body = bodyContainerRef.current;
        const root = body.offsetParent;
        const tr = trRef.current;

        //Scroll up
        const scrollUp = tr.offsetTop < root.scrollTop;
        if (scrollUp)
            root.scrollTop = tr.offsetTop;

        //Scroll down
        const visibleHeight = root.clientHeight - body.offsetTop;
        const rowBottom = tr.offsetTop + tr.offsetHeight;
        const scrollDown = rowBottom > (root.scrollTop + visibleHeight);
        if (scrollDown)
            root.scrollTop = rowBottom - visibleHeight;

        //visibleItemCount is a dependency so that when items are added or removed, the active row stays visible
    }, [active, visibleItemCount]);

    const handleContextMenu = useCallback(e => {
        e.stopPropagation();

        if (isTouchingRef.current) {
            actions.baseSelect(value, true, false);
            dragSelectStart([e.clientX, e.clientY], index);
        } else {
            actions.contextMenu(e, value);
        }
    }, [value, index, actions]);

    const handleMouseDown = useCallback(e => {
        if (e.button !== 0) return;
        e.stopPropagation();

        actions.select(e, value);
        dragSelectStart([e.clientX, e.clientY], index);
    }, [value, index, actions]);

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
