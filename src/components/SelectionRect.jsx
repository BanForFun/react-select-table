import styles from "../index.scss";
import React, {useContext} from 'react';

export const SelectionRectContext = React.createContext(null);
SelectionRectContext.displayName = "SelectionRectContext";

function SelectionRect({ bodyContainerRef }) {
    const rect = useContext(SelectionRectContext);
    if (!rect) return null;

    const { offsetTop, offsetLeft } = bodyContainerRef.current;
    const style = {
        ...rect,
        transform: `translate(${offsetLeft}px, ${offsetTop}px)`,
    }

    return <div className={styles.selection} style={style} />;
}

export default React.memo(SelectionRect);
