import React, { Fragment, useCallback, useContext, useLayoutEffect, useRef } from 'react'
import AngleIcon, { angleRotation } from './AngleIcon'
import HourGlassIcon from './HourGlassIcon'
import withGestures from '../hoc/withGestures'
import { dataAttributeFlags, getFlagAttribute } from '../utils/dataAttributeUtils'
import GestureContext from '../context/GestureTarget'

export const LoadingAttribute = getFlagAttribute('loading')

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
  const gesture = useContext(GestureContext)

  const isSortable = !!path

  const loadingIconRef = useRef()

  const sortColumn = useCallback(addToPrev => {
    if (!isSortable) return
    requestAnimationFrame(() => {
      loadingIconRef.current.toggleAttribute(LoadingAttribute, true)
      setTimeout(() => actions.sortItems(path, addToPrev))
    })
    return true
  }, [actions, path, isSortable])

  const handleTitleMouseDown = useCallback(e => {
    if (e.button !== 0) return
    sortColumn(e.shiftKey)
  }, [sortColumn])

  const handleTitleKeyDown = useCallback(e => {
    // Toggle sort order when space is pressed
    if (e.keyCode !== 32) return
    e.stopPropagation()

    if (!sortColumn(e.shiftKey)) return
    e.preventDefault() // Prevent scroll
  }, [sortColumn])

  const handleTitleContextMenu = useCallback(() => {
    if (gesture.pointerType !== 'touch') return
    sortColumn(true)
  }, [sortColumn, gesture])

  useLayoutEffect(() => {
    loadingIconRef.current.toggleAttribute(LoadingAttribute, false)
  }, [sortAscending])

  return <th className={className}
    onPointerDownCapture={handleGesturePointerDownCapture}
    onTouchStart={handleGestureTouchStart}
    {...dataAttributeFlags({ sortable: isSortable, resizing: isResizing })}
  >
    <div className='rst-headerContent'
      onMouseDown={handleTitleMouseDown}
      onContextMenu={handleTitleContextMenu}
      onKeyDown={handleTitleKeyDown}
      tabIndex={isSortable ? 0 : -1}
      role="none"
    >
      <span className='rst-headerText'>{title}</span>
      <HourGlassIcon ref={loadingIconRef} />
      {sortPriority >= 0 && <Fragment>
        <AngleIcon rotation={sortAscending ? angleRotation.Up : angleRotation.Down} />
        {showPriority && <small>{sortPriority}</small>}
      </Fragment>}
    </div>
    {isResizable && <div
      className='rst-columnResizer'
      onDragStart={e => e.preventDefault()}
      onPointerDown={columnResize}
    />}
  </th>
}

export default withGestures(TableHeader)
