import React, { useCallback, useRef, useEffect, useContext, useLayoutEffect } from 'react'
import TableChunk from './TableChunk'
import ColumnGroupContext from '../context/ColumnGroup'
import { getFlagAttribute } from '../utils/dataAttributeUtils'

export const HiddenAttribute = getFlagAttribute('hidden')
export const LastWidthAttribute = 'data-last-width'

/**
 * Child of {@link Components.TableBody}.
 *
 * @name Components.ChunkObserver
 * @type {React.FC}
 */
function ChunkObserver(props) {
  const {
    chunkObserverRef,
    indexOffset,
    utils: { hooks, selectors },
    ...chunkProps
  } = props

  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  const chunkRef = useRef()
  const isRefreshingRef = useRef(false)

  const { resizingIndex } = useContext(ColumnGroupContext)

  const refreshChunk = useCallback(() => {
    const observer = chunkObserverRef.current
    if (!observer) return

    const chunk = chunkRef.current
    const isHidden = chunk.hasAttribute(HiddenAttribute)
    if (!isHidden) return

    observer.unobserve(chunk)
    chunk.toggleAttribute(HiddenAttribute, false)
    isRefreshingRef.current = true

    // We don't call observe here, so that the chunk is guaranteed rendered
    // when the layout effect of ScrollingContainer runs to scroll to the active row.
    // Instead, observe is called in a normal effect below, which runs after all the layout events
  }, [chunkObserverRef])

  useEffect(() => {
    // isRefreshing will never be true when chunking is disabled
    if (!isRefreshingRef.current) return

    chunkObserverRef.current.observe(chunkRef.current)
    isRefreshingRef.current = false
  })

  useLayoutEffect(() => {
    if (resizingIndex >= 0) return
    refreshChunk()
  }, [resizingIndex, refreshChunk])

  // Refreshes all the chunks above the active one, if the width of the table has changed since the last refresh,
  // to avoid them refreshing after the table has scrolled to the active row and pushing it out of view again
  // (because after the scroll position change, some of them may start intersecting the scrolling container).
  useLayoutEffect(() => {
    // Don't refresh the chunk that has the active row, or any below it
    if (activeRowIndex <= indexOffset) return

    const chunk = chunkRef.current
    const lastWidth = chunk.getAttribute(LastWidthAttribute)
    const width = chunk.clientWidth.toString()
    if (width === lastWidth) return

    refreshChunk()
  }, [activeRowIndex, indexOffset, refreshChunk])

  useEffect(() => {
    const observer = chunkObserverRef.current
    if (!observer) return

    const chunk = chunkRef.current
    observer.observe(chunk)
    return () => observer.unobserve(chunk)
  }, [chunkObserverRef])

  return <TableChunk
    ref={chunkRef}
    refresh={refreshChunk}
    {...chunkProps} />
}

export default ChunkObserver
