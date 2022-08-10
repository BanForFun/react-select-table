import React, { Fragment, useCallback, useContext, useLayoutEffect, useRef } from 'react'
import AngleIcon, { angleRotation } from './AngleIcon'
import HourGlassIcon from './HourGlassIcon'
import withGestures from '../hoc/withGestures'
import { dataAttributeFlags } from '../utils/dataAttributeUtils'
import GestureContext from '../context/GestureTarget'

/**
 * Child of {@link Components.TableHead}.
 *
 * @name Components.TableHeader
 * @type {React.FC}
 */
function TableHeader({
  handleGesturePointerDownCapture,
  handleGestureTouchStart,
  path,
  title,
  columnResize,
  actions,
  sortAscending,
  sortPriority,
  showPriority,
  isResizing,
  isResizable,
  className
}) {
  const loadingRef = useRef()

  const gesture = useContext(GestureContext)

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

  const handleContextMenu = useCallback(() => {
    if (gesture.pointerType !== 'touch') return
    sortColumn(true)
  }, [sortColumn, gesture])

  useLayoutEffect(() => {
    loadingRef.current.style.display = 'none'
  }, [sortAscending])

  return <th className={className}
    onPointerDownCapture={handleGesturePointerDownCapture}
    onTouchStart={handleGestureTouchStart}
    {...dataAttributeFlags({ sortable: !!path, resizing: isResizing })}
  >
    <div className='rst-headerContent'
      onMouseDown={handleTitleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <span className='rst-headerText'>{title}</span>
      {sortPriority >= 0 && <Fragment>
        <AngleIcon rotation={sortAscending ? angleRotation.Up : angleRotation.Down} />
        {showPriority && <small>{sortPriority}</small>}
      </Fragment>}
      <HourGlassIcon ref={loadingRef} />
    </div>
    {isResizable && <div
      className='rst-columnResizer'
      onDragStart={e => e.preventDefault()}
      onPointerDown={columnResize}
    />}
  </th>
}

export default withGestures(TableHeader)
