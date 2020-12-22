import styles from "../index.scss";

import React, {useCallback} from 'react';
import classNames from "classnames";
import _ from "lodash";
import BodyCell from "./TableCell";

function TableRow({
    columns,
    name,
    onContextMenu,
    onMouseDown,
    onTouchStart,

    selected,
    active,
    item,
    value,
    index
}) {
    const renderColumn = column => {
        const { _id, path, render, className, isHeader } = column;
        const content = _.get(item, path);

        const props = {
            content,
            key: `cell_${name}_${value}_${_id}`,
            className, isHeader, render
        }

        return <BodyCell {...props} />
    };

    const getEventHandler = handler =>
        useCallback(e => handler(e, index), [index]);

    const classes = {
        [styles.selected]: selected,
        [styles.active]: active
    };

    return <tr
        className={classNames(classes, item._className)}
        onContextMenu={getEventHandler(onContextMenu)}
        onMouseDown={getEventHandler(onMouseDown)}
        onTouchStart={getEventHandler(onTouchStart)}
    >
        {columns.map(renderColumn)}
    </tr>;
}

export default React.memo(TableRow);
