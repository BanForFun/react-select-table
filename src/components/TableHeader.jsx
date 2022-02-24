import React, {Fragment, useCallback, useMemo} from 'react';
import AngleIcon, {angleRotation} from "./AngleIcon";
import classNames from "classnames";

//Child of TableHead
function TableHeader({
    path,
    title,
    index,
    columnResizeStart,
    actions,
    sortAscending,
    sortPriority,
    showPriority,
    isResizing,
    scrollingContainerRef,
    utils: { options }
}) {
    const resizerHeight = useMemo(() =>
        isResizing ? scrollingContainerRef.current.clientHeight : undefined,
        [scrollingContainerRef, isResizing])

    const handleTitleMouseDown = useCallback(e => {
        if (e.button !== 0 || !path) return;
        actions.baseSortItems(path, options.multiSort && e.shiftKey);
    }, [path, actions, options]);

    const handlePointerDown = useCallback(e => {
        columnResizeStart(e, index);
    }, [columnResizeStart, index]);

    const className = classNames({
        "rst-header": true,
        "rst-sortable": !!path,
        "rst-resizing": isResizing,
    });

    return <th scope="col" className={className}>
        <div className="rst-columnSeparator" />

        <div className="rst-headerContent">
            <span className="rst-headerText" onMouseDown={handleTitleMouseDown}>{title}</span>
            {sortPriority >= 0 && <Fragment>
                <AngleIcon rotation={sortAscending ? angleRotation.Up : angleRotation.Down}/>
                {showPriority && <small>{sortPriority}</small>}
            </Fragment>}
        </div>
        <div
            className="rst-columnResizer"
            style={{ height: resizerHeight }}
            onPointerDown={handlePointerDown}
        />
    </th>
}

export default React.memo(TableHeader);
