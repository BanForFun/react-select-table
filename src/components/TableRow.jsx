import React from 'react'
import TableCell from './TableCell'
import withGestures from '../hoc/withGestures'
import { dataAttributeFlags, getFlagAttributes } from '../utils/dataAttributeUtils'

const flags = {
  Selected: 'selected',
  Active: 'active'
}

export const RowAttributes = getFlagAttributes(flags)

export function getRowBounds(row) {
  if (!row) return null

  const { offsetHeight: height, offsetTop: top } = row
  if (!height) return null

  return { top, bottom: top + height }
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
      [flags.Active]: active,
      [flags.Selected]: selected
    })}
  >
    {columns.map(renderColumn)}
    <td className='rst-endCap' />
    <td className='rst-spacer' />
  </tr>
}

export default withGestures(TableRow)
