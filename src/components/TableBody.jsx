import React, { useCallback, useLayoutEffect, useMemo } from 'react'
import _ from 'lodash'
import TableChunk, { loadChunk } from './TableChunk'
import { getRowBounds } from './TableRow'
import * as selectors from '../selectors/selectors'
import { DragModes } from '../constants/enums'
import storeSymbols from '../constants/storeSymbols'

// Child of BodyContainer
function TableBody(props) {
  const {
    selectionRectRef,
    scrollingContainerRef,
    getChunkRow,
    tableBodyRef,
    dragMode,
    showPlaceholder,
    ...chunkCommonProps
  } = props

  const {
    utils: { hooks, options }
  } = props

  const rowValues = hooks.useSelector(s => s[storeSymbols.rowValues])
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

  const chunks = useMemo(() => _.chunk(rowValues, options.chunkSize),
    [rowValues, options])

  const renderChunk = (rowValues, index) => {
    return <TableChunk
      {...chunkCommonProps}
      key={`chunk_${props.name}_${index}`}
      rowValues={rowValues}
      index={index}
    />
  }

  return <div className='rst-body' ref={tableBodyRef}>
    {!showPlaceholder && chunks.map(renderChunk)}
    {dragMode === DragModes.Select &&
      <div className='rst-dragSelection' ref={selectionRectRef} />}
  </div>
}

export default TableBody
