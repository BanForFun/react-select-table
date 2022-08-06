import React from 'react'
import _ from 'lodash'
import TableCell from './TableCell'
import withGestures from '../hoc/withGestures'
import { dataAttributeFlags, getFlagAttributes } from '../utils/dataAttributeUtils'

const stateFlags = {
  Selected: 'selected',
  Active: 'active'
}

export const StateAttributes = getFlagAttributes(stateFlags)

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
  handleGesturePointerDownCapture,
  handleGestureTouchStart,
  columns,
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

  return <tr
    className={'rst-row ' + className}
    onPointerDownCapture={handleGesturePointerDownCapture}
    onTouchStart={handleGestureTouchStart}
    {...dataAttributeFlags({
      [stateFlags.Active]: active,
      [stateFlags.Selected]: selected
    })}
  >
    {columns.map(renderColumn)}
    <td className='rst-endCap' />
    <td className='rst-spacer' />
  </tr>
}

export default React.memo(withGestures(TableRow), _.isEqual)
// export default TableRow
