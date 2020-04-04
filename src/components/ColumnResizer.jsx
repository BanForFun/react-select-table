import React from 'react';
import _ from "lodash";

const ColumnResizer = ({ columns, name }) => {
    return <thead>
        <tr>
            {columns.map(col => {
                const { width, id } = col.props;

                return <th key={`th_${name}_${id}`}
                    style={{ width }} />
            })}
        </tr>
    </thead>;
}

export default ColumnResizer