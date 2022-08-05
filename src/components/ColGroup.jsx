import React, { useContext } from 'react'
import ColumnGroupContext from '../context/ColumnGroup'
import _ from 'lodash'

/**
 * Child of {@link Components.TableBody}.
 * Child of {@link Components.TableHead}.
 *
 * @name Components.ColGroup
 * @type {React.FC}
 */
const ColGroup = ({ name, columns }, ref) => {
  const { widths, widthUnit, containerWidth } = useContext(ColumnGroupContext)

  // Ensure that when the table is overflowing, the smallest column has a width of 100%,
  // so that when a column gets hidden, the other columns share the space it occupied between themselves,
  // instead of the spacer taking it
  const factor = containerWidth > 100 ? 100 / _.min(_.values(widths)) : 1

  return <colgroup ref={ref}>
    {columns.map(({ key }) =>
      <col key={`col_${name}_${key}`}
        style={{ width: widthUnit(widths[key] * factor) }}
        data-col-key={key}
      />
    )}
  </colgroup>
}

export default React.forwardRef(ColGroup)
