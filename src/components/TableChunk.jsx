import React, { useLayoutEffect } from 'react'
import TableRow from './TableRow'
import GestureTarget from '../models/GestureTarget'
import { GestureTargetTypes } from '../constants/enums'
import { comparePropsDeep } from '../utils/memoUtils'

/**
 * Child of {@link Components.ChunkObserver}.
 *
 * @name Components.TableChunk
 * @type {React.FC}
 */
function TableChunk(props, ref) {
  const {
    rows,
    contextMenu,
    refresh,
    ...rowCommonProps
  } = props

  // Refresh on every prop change
  useLayoutEffect(refresh)

  const renderRow = row => {
    const rowProps = {
      ...rowCommonProps,
      row,
      key: `row_${props.name}_${row.key}`,
      gestureTarget: GestureTarget(GestureTargetTypes.Row, row.index),
      onDualTap: contextMenu
    }

    return <TableRow {...rowProps} />
  }

  return <tbody className='rst-chunk' ref={ref}>
    {rows.map(renderRow)}
  </tbody>
}

export default React.memo(React.forwardRef(TableChunk), comparePropsDeep)
