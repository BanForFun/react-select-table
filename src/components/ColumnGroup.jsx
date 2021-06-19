import React, {useContext, useCallback} from 'react';

export const ColumnGroupContext = React.createContext(null);
ColumnGroupContext.displayName = "ColumnGroupContext";

//Child of HeadContainer
//Child of BodyContainer

function ColumnGroup({ id }) {
    const { widths, columns, name, refs } = useContext(ColumnGroupContext);

    const setRef = useCallback(ref => {
        refs[id] = ref;
    }, [refs, id]);

    const Column = useCallback(({ width }) => {
        const units = widths.resizing ? "px" : "%";
        return <col style={{ width: width + units }} />
    }, [widths]);

    return <colgroup ref={setRef}>
        {columns.map((col, index) =>
            <Column key={`header_${name}_${col._id}`} width={widths.headers[index]} />)}

        <Column width={widths.spacer} />
    </colgroup>;
}

export default ColumnGroup;
