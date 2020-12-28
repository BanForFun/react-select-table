import styles from "../index.scss";

import React from 'react';
import TableHead from "./TableHead";
import ColumnGroup from "./ColumnGroup";

function HeadContainer(props) {
    return <div className={styles.headContainer}>
        <table>
            <ColumnGroup columns={props.columns} name={props.name} />
            <TableHead {...props} />
        </table>
    </div>
}

export default React.memo(HeadContainer);
