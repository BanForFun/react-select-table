import React from 'react'

const ColGroup = ({ name, columns, widths }) => {
  return <colgroup>
    {columns.map((col, index) =>
      <col key={`col_${name}_${col.key}`} width={widths[index]} />)}
  </colgroup>
}

export default ColGroup
