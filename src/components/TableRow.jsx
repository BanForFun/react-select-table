import React from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import TableCell from './TableCell'

export const ActiveClass = 'rst-active'
export const SelectedClass = 'rst-selected'

export function getRowBounds(row) {
  const chunk = row?.offsetParent
  if (!chunk) return null

  const top = chunk.offsetTop + row.offsetTop
  return { top, bottom: top + row.offsetHeight }
}

// Child of TableBody
const TableRow = ({
  columns,
  setGestureTarget,
  targetTouchStart,
  selected,
  active,
  index,
  className,
  name,
  itemKey,
  item
}) => {
  console.log('Rendered row', index)

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
    onPointerDownCapture={() => setGestureTarget(index)}
    onTouchStart={e => targetTouchStart(e, true)}
  >
    {columns.map(renderColumn)}
    <td className='rst-spacer' />
  </tr>
}

export default React.memo(TableRow, _.isEqual)
