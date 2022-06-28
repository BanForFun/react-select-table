import React, { Fragment, useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import AngleIcon, { angleRotation } from './AngleIcon'
import classNames from 'classnames'
import HourGlassIcon from './HourGlassIcon'

// Child of TableHead
function TableHeader({
  path,
  title,
  index,
  width,
  columnResizeStart,
  actions,
  sortAscending,
  sortPriority,
  showPriority,
  isResizing,
  isResizable,
  showPlaceholder,
  scrollingContainerRef
}) {
  const loadingRef = useRef()

  const resizerHeight = useMemo(() =>
    (isResizing && !showPlaceholder) ? scrollingContainerRef.current.clientHeight : undefined,
  [scrollingContainerRef, isResizing, showPlaceholder])

  const handleTitleMouseDown = useCallback(e => {
    if (e.button !== 0 || !path) return
    const { shiftKey } = e
    requestAnimationFrame(() => {
      loadingRef.current.style.display = 'initial'
      setTimeout(() => actions.sortItems(path, shiftKey), 0)
    })
  }, [actions, path])

  useLayoutEffect(() => {
    loadingRef.current.style.display = 'none'
  }, [sortAscending])

  const handlePointerDown = useCallback(e => {
    if (!e.isPrimary) return
    columnResizeStart(e.clientX, e.clientY, e.pointerId, index)
  }, [columnResizeStart, index])

  const className = classNames({
    'rst-header': true,
    'rst-sortable': !!path,
    'rst-resizing': isResizing
  })

  return <th className={className} style={{ width }}>
    <div className='rst-headerContent'>
      <span className='rst-headerText'
        onMouseDown={handleTitleMouseDown}
      >{title}</span>
      {sortPriority >= 0 && <Fragment>
        <AngleIcon rotation={sortAscending ? angleRotation.Up : angleRotation.Down} />
        {showPriority && <small>{sortPriority}</small>}
      </Fragment>}
      <HourGlassIcon ref={loadingRef} />
    </div>
    {isResizable && <div
      className='rst-columnResizer'
      style={{ height: resizerHeight }}
      onPointerDown={handlePointerDown}
    />}
  </th>
}

export default TableHeader
