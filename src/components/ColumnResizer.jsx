import React from 'react';
import _ from "lodash";

const ColumnResizer = ({ columns, name }) => {
    return <colgroup>
        {columns.map(col => {
            const { width, id } = col.meta;

            return <col key={`col_${name}_${id}`}
                style={{ width }} />
        })}
    </colgroup>;
}

export default ColumnResizer