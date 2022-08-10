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
  const isRefreshingRef = useRef(false)

  const { resizingIndex } = useContext(ColumnGroupContext)

  const refreshChunk = useCallback(() => {
    const chunk = chunkRef.current
    const isHidden = chunk.hasAttribute(HiddenAttribute)
    if (!isHidden) return

    chunkObserverRef.current.unobserve(chunk)
    chunk.toggleAttribute(HiddenAttribute, false)
    isRefreshingRef.current = true

    // We don't call observe here, so that the chunk is guaranteed rendered
    // when the layout effect of ScrollingContainer runs to scroll to the active row.
    // Instead, observe is called in a normal effect below, which runs after all the layout events
  }, [chunkObserverRef])

  useEffect(() => {
    if (!isRefreshingRef.current) return

    chunkObserverRef.current.observe(chunkRef.current)
    isRefreshingRef.current = false
  })

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
