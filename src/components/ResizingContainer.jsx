import React, { useRef, useContext, useCallback, Fragment, useMemo } from 'react'
import _ from 'lodash'
import TableBody from './TableBody'
import TableHead from './TableHead'
import ColumnGroupContext from '../context/ColumnGroup'
import * as setUtils from '../utils/setUtils'
import { GestureTargets } from '../constants/enums'
import classNames from 'classnames'
import useDecoupledCallback from '../hooks/useDecoupledCallback'
import { pc } from '../utils/tableUtils'

// Child of ScrollingContainer
// Handles gestures
function ResizingContainer(props) {
  const {
    // Own props
    resizingContainerRef,
    dragSelectStart,
    placeholder,
    onItemsOpen,

    // HeadContainer props
    headColGroupRef,
    columnResizeStart,
    actions,

    // BodyContainer props
    getRowClassName,
    selectionRectRef,
    tableBodyRef,

    ...commonProps
  } = props

  const {
    utils: { hooks, events, options, selectors },
    columns,
    dragMode
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

  const itemsOpen = useCallback(e => {
    if (e.ctrlKey || noSelection || showPlaceholder) return
    onItemsOpen?.(selectors.getSelectionArg(getState()), false)
  }, [noSelection, showPlaceholder, onItemsOpen, selectors, getState])

  const getGestureTargetTouchStartHandler = useCallback((touchCount, callback) => {
    return (e, includeChildren) => {
      if (dragMode) return

      if (!_.every(e.touches, t => includeChildren
        ? e.currentTarget.contains(t.target) : e.currentTarget === t.target)) return

      e.stopPropagation()

      if (e.touches.length !== touchCount) return
      callback(e)
      return true
    }
  }, [dragMode])

  const gestureTargetPointerDownCapture = useCallback((rowIndex) => {
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

    if (events.hasListener('onContextMenu'))
      e.preventDefault()

    contextMenu(e)
  }, [gesture, contextMenu, actions, events, dragSelect, showPlaceholder])

  const handleDoubleClick = useCallback(e => {
    itemsOpen(e)
  }, [itemsOpen])

  //#endregion

  const contextMenuTargetTouchStart = useMemo(() =>
    getGestureTargetTouchStartHandler(2, contextMenu),
  [contextMenu, getGestureTargetTouchStartHandler])

  const itemsOpenTargetTouchStart = useMemo(() =>
    getGestureTargetTouchStartHandler(2, itemsOpen),
  [getGestureTargetTouchStartHandler, itemsOpen])

  Object.assign(commonProps, {
    gestureTargetPointerDownCapture: useDecoupledCallback(gestureTargetPointerDownCapture),
    contextMenuTargetTouchStart: useDecoupledCallback(contextMenuTargetTouchStart)
  })

  const headProps = {
    ...commonProps,
    headColGroupRef,
    actions,

    columnResizeStart
  }

  const bodyProps = {
    ...commonProps,
    tableBodyRef,
    selectionRectRef,

    showPlaceholder,
    getRowClassName
  }

  const { containerWidth, widths } = useContext(ColumnGroupContext)

  const contextMenuGestureHandlers = {
    onPointerDownCapture: () => gestureTargetPointerDownCapture(GestureTargets.BelowItems),
    onTouchStart: e => {
      if (contextMenuTargetTouchStart(e, false)) return
      itemsOpenTargetTouchStart(e, true)
    },
    onPointerDown: handlePointerDown,
    onContextMenu: handleContextMenu
  }

  // The width of a hidden column must be distributed to the other columns, because the width of the container
  // must stay constant, as columns can be hidden using css while shrinking the container,
  // and we have no way to know when that happens (without javascript) in order to update the container width

  // The situation is easier when the table is not overflowing horizontally, as the width of the hidden column
  // can just go to the spacer with the container width staying constant

  // Stoppers control the size of the container before it overflows because a column reached its minimum size.
  // Can't use minWidth because we can't update it when a column gets hidden for the same reason as the container width.

  // Each column contributes a chunk to the stopper of every column, proportional to the column's size.
  // These chunks are also hidden together with the column, and thus the stoppers of all columns
  // shrink when a column is hidden to account for the width they gain when the width of the now hidden column,
  // gets distributed to the other columns (for an overflowing table)

  // For a non-overflowing table, there are two stages when shrinking the container.
  // In the first stage, when a column reaches its minimum size, the table stops shrinking (.rst-resizingContainer)
  // and the spacer starts being cropped (by .rst-clippingContainer)
  // In the second stage, when there is no spacer left, the clipping container also stops shrinking
  // and starts overflowing its parent (.rst-scrollingContainer) causing the horizontal scrollbar to appear

  const columnKeys = _.map(columns, 'key')
  const columnStoppers = _.map(columnKeys, referenceKey => {
    const minWidthScale = options.minColumnWidth / widths[referenceKey]
    return <div className="rst-columnStopper rst-stopper"
      data-col-key={referenceKey}
      key={`stoppers-${referenceKey}`}
    >
      {_.map(columnKeys, key =>
        <div
          data-col-key={key}
          key={`stopper-${key}`}
          style={{ width: widths[key] * minWidthScale }}
        />)}
    </div>
  })

  const containerStopperWidths = _.map(columnKeys, key =>
    containerWidth / widths[key] * options.minColumnWidth)

  const overflowing = containerWidth > 100
  const showClipStoppers = !!containerWidth && !overflowing // containerWidth is 0 when resizing the columns

  return <Fragment>
    <div className={classNames({
      'rst-clippingContainer': true,
      'rst-clipping': showClipStoppers
    })}>
      {showClipStoppers && columnStoppers}
      <div
        className={classNames({
          'rst-resizingContainer': true,
          'rst-showPlaceholder': showPlaceholder
        })}
        ref={resizingContainerRef}
        style={{
          width: pc(containerWidth),
          marginRight: showClipStoppers ? -_.max(containerStopperWidths) : 0
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        {...contextMenuGestureHandlers}
      >
        {!!containerWidth && (overflowing ? columnStoppers : _.map(columnKeys, (key, index) =>
          <div className="rst-containerStopper rst-stopper"
            data-col-key={key}
            key={`stopper-${key}`}
            style={{ width: containerStopperWidths[index] }}
          />
        ))}
        <TableHead {...headProps} />
        <TableBody {...bodyProps} />
      </div>
    </div>
    {placeholder && <div
      className="rst-placeholder"
      {...contextMenuGestureHandlers}
    >{placeholder}</div>}
  </Fragment>
}

export default ResizingContainer
