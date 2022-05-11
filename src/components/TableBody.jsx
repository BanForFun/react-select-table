import React, { useCallback, useLayoutEffect, useMemo } from 'react'
import _ from 'lodash'
import TableChunk, { loadChunk } from './TableChunk'
import { DragModes } from '../utils/tableUtils'
import { getRowBounds } from './TableRow'

// Child of BodyContainer
function TableBody(props) {
  const {
    selectionRectRef,
    scrollingContainerRef,
    getChunkRow,
    tableBodyRef,
    placeholder,
    dragMode,
    ...chunkCommonProps
  } = props

  const {
    utils: { hooks, options, selectors }
  } = props

  const rowValues = hooks.useSelector(s => s.rowValues)
  const sortedItems = hooks.useSelector(s => s.sortedItems)
  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  const getContainerVisibleBounds = useCallback(() => {
    const container = scrollingContainerRef.current
    const body = tableBodyRef.current
    return {
      top: container.scrollTop,
      bottom: container.scrollTop + container.clientHeight - body.offsetTop
    }
  }, [scrollingContainerRef, tableBodyRef])

  // Ensure active row visible
  useLayoutEffect(() => {
    const chunkRow = getChunkRow(activeRowIndex)
    if (!chunkRow) return

    loadChunk(chunkRow.chunk)

    const containerBounds = getContainerVisibleBounds()
    const rowBounds = getRowBounds(chunkRow.row)
    const distanceToTop = rowBounds.top - containerBounds.top
    const distanceToBottom = rowBounds.bottom - containerBounds.bottom

    const scrollOffset = Math.min(0, distanceToTop) + Math.max(0, distanceToBottom)
    scrollingContainerRef.current.scrollTop += scrollOffset
  }, [activeRowIndex, getChunkRow, getContainerVisibleBounds, scrollingContainerRef])

  const chunks = useMemo(() => {
    const chunks = _.chunk(rowValues, options.chunkSize)
    for (const chunk of chunks)
      // Mutate chunk instead of creating yet another copy
      chunk.forEach((value, index) => (chunk[index] = sortedItems[value].data))

    return chunks
  }, [rowValues, sortedItems, options])

  const renderChunk = (rows, index) => {
    return <TableChunk
      {...chunkCommonProps}
      key={`chunk_${props.name}_${index}`}
      rows={rows}
      index={index}
    />
  }

  return <div className='rst-body' ref={tableBodyRef}>
    {placeholder || chunks.map(renderChunk)}

    {dragMode === DragModes.Select &&
      <div className='rst-dragSelection' ref={selectionRectRef} />}
  </div>
}

export default TableBody
