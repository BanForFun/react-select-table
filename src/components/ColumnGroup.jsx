import React, {useContext} from 'react';

export const ColumnWidthsContext = React.createContext(null);
ColumnWidthsContext.displayName = "ColumnWidthsContext";

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

export default ColumnGroup;
