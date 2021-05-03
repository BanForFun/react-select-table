import React, {useContext} from 'react';

export const ColumnWidthsContext = React.createContext(null);
ColumnWidthsContext.displayName = "ColumnWidthsContext";

//Child of HeadContainer
//Child of BodyContainer

const Column = ({ width }) => <col style={{ width: `${width}%` }} />

function ColumnGroup({ columns, name }) {
    const {widths, padding} = useContext(ColumnWidthsContext);

    return <colgroup>
        {columns.map((col, index) =>
            <Column key={`col_${name}_${col._id}`} width={widths[index]} />)}

        <Column key={`spacer_${name}`} width={padding} />
    </colgroup>;
}

export default React.memo(ColumnGroup);
