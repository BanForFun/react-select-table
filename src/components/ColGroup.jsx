import React, { useContext } from 'react'
import ColumnGroupContext from '../context/ColumnGroup'

const ColGroup = ({ name, columns }) => {
  const { widths } = useContext(ColumnGroupContext)
  return <colgroup>
    {columns.map((col, index) =>
      <col key={`col_${name}_${col.key}`} width={widths[index]} />)}
  </colgroup>
}

export default ColGroup
