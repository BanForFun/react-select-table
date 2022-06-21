import React, { useRef, useContext, useCallback, Fragment } from 'react'
import _ from 'lodash'
import TableBody from './TableBody'
import TableHead from './TableHead'
import ColumnGroupContext from '../context/ColumnGroup'
import * as selectors from '../selectors/selectors'
import { GestureTargets } from '../constants/enums'
import classNames from 'classnames'
import storeSymbols from '../constants/storeSymbols'

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
    getChunkRow,
    chunkIntersectionObserver,

    ...commonProps
  } = props

  const {
    utils: { hooks, events, options }
  } = props

  const gesture = useRef({
    pointerId: null,
    rowIndex: null,
    itemIndex: null,
    pointerType: null
  }).current

  const showPlaceholder = !!placeholder

  const indexOffset = hooks.useSelector(selectors.getPageIndexOffset)
  const rowCount = hooks.useSelector(s => s[storeSymbols.rowValues].length)
  const noSelection = hooks.useSelector(s => _.isEmpty(s.selected))

  const getSelected = hooks.useSelectorGetter(selectors.getSelected)

  const raiseItemsOpen = hooks.useSelectorGetter(events.itemsOpen)
  const raiseContextMenu = hooks.useSelectorGetter(events.contextMenu)

  const contextMenu = useCallback(e => {
    const { itemIndex, rowIndex } = gesture

    if (showPlaceholder)
      raiseContextMenu(true)
    else if (e.altKey)
      raiseContextMenu(!e.ctrlKey)
    else if (itemIndex === GestureTargets.Header)
      raiseContextMenu(true)
    else if (itemIndex === GestureTargets.BelowItems) {
      if (e.shiftKey)
        actions.select(indexOffset + rowCount - 1, e.shiftKey, e.ctrlKey, true)
      else if (!options.listBox && !e.ctrlKey)
        actions.clearSelection(true)
      else
        raiseContextMenu(!e.ctrlKey)
    } else if (options.listBox || (getSelected(rowIndex) && !e.ctrlKey))
      actions.setActive(itemIndex, true)
    else
      actions.select(itemIndex, e.shiftKey, e.ctrlKey, true)
  }, [gesture, raiseContextMenu, options, rowCount, actions, indexOffset, getSelected, showPlaceholder])

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
    raiseItemsOpen(false)
  }, [noSelection, raiseItemsOpen, showPlaceholder])

  //#endregion

  Object.assign(commonProps, {
    setGestureTarget,
    targetTouchStart,
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

    chunkIntersectionObserver,

    getRowClassName,
    getChunkRow
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
