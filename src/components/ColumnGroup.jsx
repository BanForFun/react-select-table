import React, {useContext, forwardRef} from 'react';

export const ColumnGroupContext = React.createContext(null);
ColumnGroupContext.displayName = "ColumnGroupContext";

//Child of HeadContainer
//Child of BodyContainer

function ColumnGroup(props, ref) {
    const { widths, spacerWidth, name, columns } = useContext(ColumnGroupContext);

    return <colgroup ref={ref}>
        {columns.map((col, index) =>
            <col key={`header_${name}_${col._id}`} width={widths[index]} />)}

        <col width={spacerWidth} />
    </colgroup>;
}

export default forwardRef(ColumnGroup);
