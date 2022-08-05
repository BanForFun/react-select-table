import React, { Fragment, useContext, useCallback } from 'react'
import _ from 'lodash'
import TableBody from './TableBody'
import TableHead from './TableHead'
import ColumnGroupContext from '../context/ColumnGroup'
import { GestureTargets } from '../constants/enums'
import { pc } from '../utils/tableUtils'
import { dataAttributeFlags } from '../utils/dataAttributeUtils'
import withGestures from '../hoc/withGestures'
import GestureContext from '../context/GestureTarget'

/**
 * Child of {@link Components.ScrollingContainer}.
 * Handles gestures
 *
 * @name Components.ResizingContainer
 * @type {React.FC}
 */
function ResizingContainer(props) {
  const {
    handleGesturePointerDownCapture,
    handleGestureTouchStart,
    dragSelect,
    itemsOpen,
    placeholder,

    // HeadContainer props
    headColGroupRef,
    columnResizeStart,
    actions,

    // BodyContainer props
    getRowClassName,
    tableBodyRef,
    contextMenu,
    dragMode,
    selectionRectRef,

    ...commonProps
  } = props

  const {
    utils: { options, hooks, selectors, events },
    columns
  } = props

  const showPlaceholder = !!placeholder

  const { containerWidth, widths } = useContext(ColumnGroupContext)
  const gesture = useContext(GestureContext)

  const rowCount = hooks.useSelector(s => s.rowKeys.length)
  const indexOffset = hooks.useSelector(selectors.getPageIndexOffset)

  const handleMouseDown = useCallback(e => {
    if (showPlaceholder || e.button !== 0) return

    const { target } = gesture
    switch (target) {
      case GestureTargets.Header: return
      case GestureTargets.BelowItems:
        if (e.shiftKey)
          actions.select(indexOffset + rowCount - 1, e.shiftKey, e.ctrlKey)
        else if (!options.listBox && !e.ctrlKey)
          actions.clearSelection()

        break
      default:
        actions.select(indexOffset + target, e.shiftKey, e.ctrlKey)
        break
    }

    if (gesture.pointerType === 'mouse') {
      getSelection().removeAllRanges()
      dragSelect(e)
    }
  }, [gesture, actions, options, indexOffset, rowCount, dragSelect, showPlaceholder])

  const handleContextMenu = useCallback(e => {
    if (e.shiftKey) return // Show browser context menu when holding shift

    const { target } = gesture
    if (gesture.pointerType !== 'mouse' && !showPlaceholder) {
      if (target >= 0)
        actions.select(indexOffset + target, false, true)
      else if (target !== GestureTargets.BelowItems)
        return

      return dragSelect(e)
    }

    if (events.hasListener('onContextMenu'))
      e.preventDefault()

    contextMenu(e)
  }, [gesture, indexOffset, contextMenu, actions, events, dragSelect, showPlaceholder])

  const gestureEventHandlers = {
    onMouseDown: handleMouseDown,
    onDoubleClick: itemsOpen,
    onContextMenu: handleContextMenu,
    onPointerDownCapture: handleGesturePointerDownCapture,
    onTouchStart: handleGestureTouchStart
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
  const clippingStoppers = <div className="rst-stoppers">{
    _.map(columnKeys, referenceKey => {
      const minWidthScale = options.minColumnWidth / widths[referenceKey]
      return <div className="rst-clippingStopper"
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
  }</div>

  const resizingStopperWidths = _.map(columnKeys, key =>
    containerWidth / widths[key] * options.minColumnWidth)

  const overflowing = containerWidth > 100
  const isResizing = !containerWidth
  const showClippingStoppers = !isResizing && !overflowing

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

    dragMode,
    showPlaceholder,
    getRowClassName,
    contextMenu
  }

  return <Fragment>
    <div
      className='rst-clippingContainer'
      {...dataAttributeFlags({ clipping: showClippingStoppers })}
    >
      {showClippingStoppers && clippingStoppers}
      <div
        className='rst-resizingContainer'
        style={{
          width: pc(containerWidth),
          marginRight: showClippingStoppers ? -_.max(resizingStopperWidths) : 0
        }}
        {...gestureEventHandlers}
      >
        {!isResizing && (overflowing ? clippingStoppers
          : <div className="rst-stoppers">{
            _.map(columnKeys, (key, index) =>
              <div className="rst-resizingStopper rst-stopper"
                data-col-key={key}
                key={`stopper-${key}`}
                style={{ width: resizingStopperWidths[index] }}
              />)
          }</div>
        )}
        <TableHead {...headProps}
          gestureTarget={GestureTargets.Header}
          onDualTap={contextMenu}
        />
        <TableBody {...bodyProps} />
      </div>
    </div>
    {showPlaceholder &&
      <div className="rst-placeholder" {...gestureEventHandlers}>{placeholder}</div>}
  </Fragment>
}

export default withGestures(ResizingContainer)
