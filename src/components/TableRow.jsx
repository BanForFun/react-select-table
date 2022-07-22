import React from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import TableCell from './TableCell'

export const ActiveClass = 'rst-active'
export const SelectedClass = 'rst-selected'

export function getRowBounds(row) {
  if (!row) return null

  const top = row.offsetTop
  return { top, bottom: top + row.offsetHeight }
}

/**
 * Child of {@link Components.TableBody}.
 *
 * @name Components.TableRow
 * @type {React.FC}
 */
const TableRow = ({
  columns,
  gestureTargetPointerDownCapture,
  contextMenuTargetTouchStart,
  selected,
  active,
  index,
  className,
  name,
  itemKey,
  item
}) => {
  const renderColumn = ({ key, ...column }) =>
    <TableCell
      {...column}
      rowItem={item}
      rowIndex={index}
      key={`cell_${name}_${itemKey}_${key}`}
    />

  const trClass = classNames(className, {
    'rst-row': true,
    [SelectedClass]: selected,
    [ActiveClass]: active
  })

  return <tr
    className={trClass}
    onPointerDownCapture={() => gestureTargetPointerDownCapture(index)}
    onTouchStart={e => contextMenuTargetTouchStart(e, true)}
  >
    {columns.map(renderColumn)}
    <td className='rst-spacer' />
  </tr>
}

export default React.memo(TableRow, _.isEqual)
// export default TableRow
