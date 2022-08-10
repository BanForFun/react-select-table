import React, { useCallback, useRef, useEffect, useContext, useLayoutEffect } from 'react'
import TableChunk from './TableChunk'
import ColumnGroupContext from '../context/ColumnGroup'

export const HiddenAttribute = 'data-is-hidden'

/**
 * Child of {@link Components.TableBody}.
 *
 * @name Components.ChunkObserver
 * @type {React.FC}
 */
function ChunkObserver(props) {
  const {
    chunkObserverRef,
    ...chunkProps
  } = props

  const chunkRef = useRef()

  const { resizingIndex } = useContext(ColumnGroupContext)

  const refreshChunk = useCallback(() => {
    const chunk = chunkRef.current
    const isHidden = chunk.hasAttribute(HiddenAttribute)
    if (!isHidden) return

    const observer = chunkObserverRef.current
    observer.unobserve(chunk)
    chunk.toggleAttribute(HiddenAttribute, false)
    observer.observe(chunk)
  }, [chunkObserverRef])

  useLayoutEffect(() => {
    if (resizingIndex >= 0) return
    refreshChunk()
  }, [resizingIndex, refreshChunk])

  useEffect(() => {
    const chunk = chunkRef.current
    const observer = chunkObserverRef.current
    observer.observe(chunk)

    return () => observer.unobserve(chunk)
  }, [chunkObserverRef])

  return <TableChunk
    ref={chunkRef}
    refresh={refreshChunk}
    {...chunkProps} />
}

export default ChunkObserver
