import styles from "../index.scss";
import React from 'react';

function DefaultError({ error }) {
    return <div className={styles.error}>{error}</div>;
}

export default DefaultError;
