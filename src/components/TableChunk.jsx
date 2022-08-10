import React from 'react'
import TableRow from './TableRow'
import _ from 'lodash'
import GestureTarget from '../models/GestureTarget'
import { GestureTargetTypes } from '../constants/enums'

/**
 * Child of {@link Components.TableBody}.
 *
 * @name Components.TableChunk
 * @type {React.FC}
 */
function TableChunk(props) {
  const {
    rows,
    contextMenu,
    ...rowCommonProps
  } = props

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

  return <tbody className='rst-chunk'>
    {rows.map(renderRow)}
  </tbody>
}

export default React.memo(TableChunk, _.isEqual)
