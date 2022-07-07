import React, { useContext } from 'react'
import ColumnGroupContext from '../context/ColumnGroup'

const ColGroup = ({ name, columns }) => {
  const { widths, widthUnit } = useContext(ColumnGroupContext)

  return <colgroup>
    {columns.map(col =>
      <col key={`col_${name}_${col.key}`} width={widthUnit(widths[col.key])} />)}
  </colgroup>
}

export default ColGroup
