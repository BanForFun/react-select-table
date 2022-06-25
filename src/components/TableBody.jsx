import React, { useMemo } from 'react'
import _ from 'lodash'
import TableChunk from './TableChunk'
import { DragModes } from '../constants/enums'
import * as selectors from '../selectors/selectors'
import * as setUtils from '../utils/setUtils'
import * as dlMapUtils from '../utils/doublyLinkedMapUtils'

// Child of BodyContainer
function TableBody(props) {
  const {
    selectionRectRef,
    tableBodyRef,
    dragMode,
    showPlaceholder,
    utils: { hooks, options },
    ...chunkCommonProps
  } = props

  const rowKeys = hooks.useSelector(s => s.rowKeys)
  const selected = hooks.useSelector(s => s.selected)
  const items = hooks.useSelector(s => s.items)
  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  const chunks = useMemo(() => _.chunk(rowKeys, options.chunkSize), [rowKeys, options])

  const renderChunk = (rowKeys, index) => {
    const chunkRows = rowKeys.map(key => ({
      key,
      item: dlMapUtils.getItem(items, key),
      selected: setUtils.hasItem(selected, key)
    }))

    const chunkIndexOffset = index * options.chunkSize
    const chunkActiveRowIndex = activeRowIndex - chunkIndexOffset

    return <TableChunk
      {...chunkCommonProps}
      rows={chunkRows}
      activeRowIndex={_.clamp(chunkActiveRowIndex, -1, rowKeys.length)}
      indexOffset={chunkIndexOffset}
      key={`chunk_${props.name}_${index}`}
    />
  }

  return <div className='rst-body' ref={tableBodyRef}>
    {!showPlaceholder && chunks.map(renderChunk)}
    {dragMode === DragModes.Select &&
      <div className='rst-dragSelection' ref={selectionRectRef} />}
  </div>
}

export default TableBody
