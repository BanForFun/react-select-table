import React from "react";
import _ from "lodash";

function ColGroup({ widths, name, columns }) {
    return <colgroup>
        {columns.map((col, index) =>
            <col key={`col_${name}_${col._id}`} width={widths[index]} />)}
    </colgroup>
}

export default React.memo(ColGroup, (prev, current) => {
    if (current.isClipped) return true;
    return _.isEqual(prev, current);
});
