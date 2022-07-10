import React, { useContext } from 'react'
import ColumnGroupContext from '../context/ColumnGroup'

const ColGroup = ({ name, columns }, ref) => {
  const { widths, widthUnit, containerWidth } = useContext(ColumnGroupContext)

  return <colgroup ref={ref}>
    {columns.map(({ key }) => {
      const width = widths[key]
      return <col key={`col_${name}_${key}`}
        // Ensure that when the table is overflowing and a column gets hidden,
        // the other columns share the space it occupied between themselves, instead of the spacer taking it,
        // as having a spacer while the table is overflowing, is weird and also breaks the column resizing code.
        style={{ width: widthUnit(containerWidth > 100 ? 100 * width : width) }}
        data-col-key={key}
      />
    })}
    <col/>
  </colgroup>
}

export default React.forwardRef(ColGroup)
