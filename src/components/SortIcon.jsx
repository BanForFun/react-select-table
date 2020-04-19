import React from 'react';
import styles from "../index.scss";

const SortIcon = ({ order }) => {
    return (
        <svg className={styles.sortIcon} data-order={order}
            version="1.1" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <path d="M29.52,22.52,18,10.6,6.48,22.52a1.7,1.7,0,0,0,2.45,2.36L18,15.49l9.08,9.39a1.7,1.7,0,0,0,2.45-2.36Z"></path>
            <rect x="0" y="0" width="36" height="36" fillOpacity="0" />
        </svg>
    );
}

export default SortIcon;