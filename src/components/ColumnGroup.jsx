import React, {useContext} from 'react';

export const ColumnWidthsContext = React.createContext(null);
ColumnWidthsContext.displayName = "ColumnWidthsContext";

//Child of HeadContainer
//Child of BodyContainer
function ColumnGroup({ columns, name }) {
    const widths = useContext(ColumnWidthsContext);

    return <colgroup>
        {columns.map((col, index) => (
            <col
                key={`col_${name}_${col._id}`}
                style={{ width: `${widths[index]}%` }}
            />
        ))}
    </colgroup>;
}

export default React.memo(ColumnGroup);
