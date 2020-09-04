import React from 'react';

const ColumnResizer = ({ columns, name }) => {
    return <colgroup>
        {columns.map(col => {
            const { _width, _id } = col;
            return <col
                key={`col_${name}_${_id}`}
                style={{ width: _width }}
            />
        })}
    </colgroup>;
}

export default ColumnResizer
