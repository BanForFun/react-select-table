import React, {useContext} from 'react';

export const SelectionRectContext = React.createContext(null);
SelectionRectContext.displayName = "SelectionRectContext";

//Child of BodyContainer
function SelectionRect({ bodyContainerRef }) {
    const rect = useContext(SelectionRectContext);
    if (!rect) return null;

    const { offsetTop, offsetLeft } = bodyContainerRef.current;
    const style = {
        ...rect,
        transform: `translate(${offsetLeft}px, ${offsetTop}px)`,
    }

    return <div className="rst-selection" style={style} />;
}

export default React.memo(SelectionRect);
