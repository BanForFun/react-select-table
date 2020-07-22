import React from 'react';
import styles from "../index.scss";

function SvgComponent(props) {
    return (
        <svg viewBox="0 0 36 36" className={styles.sortIcon} {...props}>
            <path d="M29.52 22.52L18 10.6 6.48 22.52a1.7 1.7 0 002.45 2.36L18 15.49l9.08 9.39a1.7 1.7 0 002.45-2.36z"/>
        </svg>
    )
}

export default SvgComponent
