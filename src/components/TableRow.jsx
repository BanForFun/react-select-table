import React from 'react'
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
 * Child of {@link Components.TableChunk}.
 *
 * @name Components.TableRow
 * @type {React.FC}
 */
const TableRow = ({
  handleGesturePointerDownCapture,
  handleGestureTouchStart,
  columns,
  name,
  getRowClassName,
  row: { index, key, selected, active, data }
}) => {
  const renderColumn = ({ key: colKey, ...column }) =>
    <TableCell
      {...column}
      data={data}
      rowIndex={index}
      key={`cell_${name}_${key}_${colKey}`}
    />

  return <tr
    className={'rst-row ' + getRowClassName(data)}
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

export default withGestures(TableRow)
