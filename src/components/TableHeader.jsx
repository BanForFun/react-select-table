import React, { Fragment, useCallback, useLayoutEffect, useRef } from 'react'
import AngleIcon, { angleRotation } from './AngleIcon'
import classNames from 'classnames'
import HourGlassIcon from './HourGlassIcon'

/**
 * Child of {@link Components.TableHead}.
 *
 * @name Components.TableHeader
 * @type {React.FC}
 */
function TableHeader({
  path,
  title,
  index,
  columnResizeStart,
  actions,
  sortAscending,
  sortPriority,
  showPriority,
  isResizing
}) {
  const loadingRef = useRef()
  const pointerType = useRef()

  const sortColumn = useCallback(addToPrev => {
    if (!path) return
    requestAnimationFrame(() => {
      loadingRef.current.style.display = 'initial'
      setTimeout(() => actions.sortItems(path, addToPrev), 0)
    })
  }, [actions, path])

  const handleTitleMouseDown = useCallback(e => {
    if (e.button !== 0) return
    sortColumn(e.shiftKey)
  }, [sortColumn])

  const handlePointerDown = useCallback(e => {
    pointerType.current = e.pointerType
  }, [])

  const handleContextMenu = useCallback(() => {
    if (pointerType.current !== 'touch') return
    sortColumn(true)
  }, [sortColumn])

  useLayoutEffect(() => {
    loadingRef.current.style.display = 'none'
  }, [sortAscending])

  const handleResizerPointerDown = useCallback(e => {
    if (!e.isPrimary) return
    columnResizeStart(e.clientX, e.clientY, e.pointerId, index)
  }, [columnResizeStart, index])

  const className = classNames({
    'rst-header': true,
    'rst-sortable': !!path,
    'rst-resizing': isResizing
  })

  return <th className={className}>
    <div className='rst-headerContent'
      onMouseDown={handleTitleMouseDown}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    >
      <span className='rst-headerText'>{title}</span>
      {sortPriority >= 0 && <Fragment>
        <AngleIcon rotation={sortAscending ? angleRotation.Up : angleRotation.Down} />
        {showPriority && <small>{sortPriority}</small>}
      </Fragment>}
      <HourGlassIcon ref={loadingRef} />
    </div>
    {!!index && <div
      className='rst-columnResizer'
      onDragStart={e => e.preventDefault()}
      onPointerDown={handleResizerPointerDown}
    />}
  </th>
}

export default TableHeader
