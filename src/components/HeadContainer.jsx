import styles from "../index.scss";

import React from 'react';
import TableHead from "./TableHead";
import ColumnGroup from "./ColumnGroup";

function HeadContainer(props) {
    const {
        className,
        ...headProps
    } = props;

    return <div className={styles.headContainer}>
        <table className={className}>
            <ColumnGroup columns={props.columns} name={props.name} />
            <TableHead {...headProps} />
        </table>
    </div>
}

export default React.memo(HeadContainer);
