import React, { useRef, useContext, useCallback, Fragment } from 'react'
import _ from 'lodash'
import TableBody from './TableBody'
import TableHead from './TableHead'
import ColumnGroupContext from '../context/ColumnGroup'
import * as setUtils from '../utils/setUtils'
import { GestureTargets } from '../constants/enums'
import classNames from 'classnames'
import useDecoupledCallback from '../hooks/useDecoupledCallback'

// Child of ScrollingContainer
// Handles gestures
function ResizingContainer(props) {
  const {
    // Own props
    resizingContainerRef,
    dragSelectStart,
    hasEventListener,
    placeholder,

    // HeadContainer props
    tableHeaderRowRef,
    columnResizeStart,
    actions,

    // BodyContainer props
    getRowClassName,
    selectionRectRef,
    tableBodyRef,

    ...commonProps
  } = props

  const {
    utils: { hooks, events, options, selectors }
  } = props

  const gesture = useRef({
    pointerId: null,
    rowIndex: null,
    itemIndex: null,
    pointerType: null
  }).current

  const showPlaceholder = !!placeholder

  const indexOffset = hooks.useSelector(selectors.getPageIndexOffset)
  const rowCount = hooks.useSelector(s => s.rowKeys.length)
  const noSelection = hooks.useSelector(s => setUtils.isEmpty(s.selected))

  const getState = hooks.useGetState()

  const contextMenu = useCallback(e => {
    const { itemIndex, rowIndex } = gesture

    if (showPlaceholder)
      events.contextMenu(getState(), true)
    else if (e.altKey)
      events.contextMenu(getState(), !e.ctrlKey)
    else if (itemIndex === GestureTargets.Header)
      events.contextMenu(getState(), true)
    else if (itemIndex === GestureTargets.BelowItems) {
      if (e.shiftKey)
        actions.select(indexOffset + rowCount - 1, e.shiftKey, e.ctrlKey, true)
      else if (!options.listBox && !e.ctrlKey)
        actions.clearSelection(true)
      else
        events.contextMenu(getState(), !e.ctrlKey, true)
    } else if (options.listBox && e.ctrlKey)
      events.contextMenu(getState(), false, true)
    else if (options.listBox || (selectors.getSelected(getState(), rowIndex) && !e.ctrlKey))
      actions.setActive(itemIndex, true)
    else
      actions.select(itemIndex, e.shiftKey, e.ctrlKey, true)
  }, [gesture, events, options, rowCount, actions, indexOffset, getState, selectors, showPlaceholder])

  const dragSelect = useCallback(e => {
    if (gesture.pointerId == null) return
    dragSelectStart(e.clientX, e.clientY, gesture.pointerId, gesture.rowIndex)
  }, [gesture, dragSelectStart])

  const targetTouchStart = useCallback((e, includeChildren) => {
    if (!_.every(e.touches, t => includeChildren
      ? e.currentTarget.contains(t.target) : e.currentTarget === t.target)) return

    e.stopPropagation()

    if (e.touches.length === 2) contextMenu(e)
  }, [contextMenu])

  const setGestureTarget = useCallback((rowIndex) => {
    gesture.rowIndex = rowIndex
    gesture.itemIndex = rowIndex
    if (rowIndex >= 0)
      gesture.itemIndex += indexOffset
  }, [gesture, indexOffset])

  //#region Event handlers

  const handlePointerDown = useCallback(e => {
    gesture.pointerType = e.pointerType
    gesture.pointerId = e.isPrimary ? e.pointerId : null
  }, [gesture])

  const handleMouseDown = useCallback(e => {
    if (e.button !== 0) return

    const { itemIndex } = gesture
    switch (itemIndex) {
      case GestureTargets.Header: return
      case GestureTargets.BelowItems:
        if (e.shiftKey)
          actions.select(indexOffset + rowCount - 1, e.shiftKey, e.ctrlKey)
        else if (!options.listBox && !e.ctrlKey)
          actions.clearSelection()

        break
      default:
        actions.select(itemIndex, e.shiftKey, e.ctrlKey)
        break
    }

    if (gesture.pointerType === 'mouse') {
      getSelection().removeAllRanges()
      dragSelect(e)
    }
  }, [gesture, actions, options, indexOffset, rowCount, dragSelect])

  const handleContextMenu = useCallback(e => {
    if (e.shiftKey) return // Show browser context menu when holding shift

    const { itemIndex } = gesture
    if (gesture.pointerType !== 'mouse' && !showPlaceholder) {
      if (itemIndex >= 0)
        actions.select(itemIndex, false, true)
      else if (itemIndex !== GestureTargets.BelowItems)
        return

      return dragSelect(e)
    }

    if (hasEventListener('onContextMenu'))
      e.preventDefault()

    contextMenu(e)
  }, [gesture, contextMenu, actions, hasEventListener, dragSelect, showPlaceholder])

  const handleDoubleClick = useCallback(() => {
    if (noSelection || showPlaceholder) return
    events.itemsOpen(getState(), false)
  }, [noSelection, events, getState, showPlaceholder])

  //#endregion

  Object.assign(commonProps, {
    setGestureTarget: useDecoupledCallback(setGestureTarget),
    targetTouchStart: useDecoupledCallback(targetTouchStart),
    showPlaceholder
  })

  const headProps = {
    ...commonProps,
    tableHeaderRowRef,
    actions,

    columnResizeStart
  }

  const bodyProps = {
    ...commonProps,
    tableBodyRef,
    selectionRectRef,

    getRowClassName
  }

  const { containerWidth, containerMinWidth } = useContext(ColumnGroupContext)

  const contextMenuGestureHandlers = {
    onPointerDownCapture: () => setGestureTarget(GestureTargets.BelowItems),
    onTouchStart: e => targetTouchStart(e, false),
    onPointerDown: handlePointerDown,
    onContextMenu: handleContextMenu
  }

  return <Fragment>
    <div
      className={classNames({
        'rst-resizingContainer': true,
        'rst-showPlaceholder': showPlaceholder
      })}
      ref={resizingContainerRef}
      style={{
        width: containerWidth,
        minWidth: containerMinWidth
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      {...contextMenuGestureHandlers}
    >
      <TableHead {...headProps} />
      <TableBody {...bodyProps} />
    </div>
    {placeholder && <div
      className="rst-placeholder"
      {...contextMenuGestureHandlers}
    >{placeholder}</div>}
  </Fragment>
}

export default ResizingContainer
