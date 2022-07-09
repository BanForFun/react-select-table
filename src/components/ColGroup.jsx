import React, { useContext } from 'react'
import ColumnGroupContext from '../context/ColumnGroup'

const ColGroup = ({ name, columns }, ref) => {
  const { widths, widthUnit, containerWidth } = useContext(ColumnGroupContext)

  return <colgroup ref={ref}>
    {columns.map(({ key }) => {
      const width = widths[key]
      return <col key={`col_${name}_${key}`}
        // Ensure that spacer does not become visible when hiding column and the table is overflowing
        style={{ width: widthUnit(containerWidth > 100 ? 100 * width : width) }}
        data-col-key={key}
      />
    })}
    <col/>
  </colgroup>
}

export default React.forwardRef(ColGroup)
