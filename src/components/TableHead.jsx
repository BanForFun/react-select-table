import styles from "../index.scss";

import React, {useState, useCallback} from 'react';
import AngleDownIcon from './AngleDownIcon';
import useEvent from "../hooks/useEvent";

function TableHead({
    columns,
    name,
    dispatchers,
    options,
    options: {utils},
    columnResizeStart
}) {
    //Redux state
    const sortBy = utils.useSelector(s => s.sortBy);

    const [resizing, setResizing] = useState(null);

    useEvent(document, "mouseup", useCallback(() =>
        setResizing(null), []));

    return <thead data-resizing={resizing}>
        <tr>
            {columns.map((col, index) => {
                const { _id, path, title } = col;

                const dragStart = e => {
                    e.stopPropagation();
                    const bounds = e.currentTarget.getBoundingClientRect();
                    columnResizeStart(index, bounds.left, bounds.right);
                    setResizing(index);
                }

                const handleHeaderMouseDown = e => {
                    if (!path) return;
                    dispatchers.sortItems(path, e.shiftKey);
                }

                const addSeparator = options.scrollX || index < columns.length - 1;

                return <th
                    key={`header_${name}_${_id}`}
                    data-path={path}
                    onMouseDown={handleHeaderMouseDown}
                >
                    {title}
                    <AngleDownIcon
                        className={styles.sortIcon}
                        data-order={sortBy[path]}
                    />
                    {addSeparator && <div
                        className={styles.separator}
                        onMouseDown={dragStart}
                        onTouchStart={dragStart}
                    />}
                </th>
            })}
        </tr>
    </thead>
}

export default TableHead;
