import _ from 'lodash'
import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ResizingContainer from './ResizingContainer'
import { pc, px, negative } from '../utils/tableUtils'
import useDecoupledCallback from '../hooks/useDecoupledCallback'
import { getRowBounds, StateAttributes } from './TableRow'
import ColumnGroupContext from '../context/ColumnGroup'
import { DragModes, GestureTargetTypes } from '../constants/enums'
import GestureContext from '../context/GestureTarget'
import { dataAttributeFlags, flagAttributeSelector } from '../utils/dataAttributeUtils'
import * as setUtils from '../utils/setUtils'
import GestureTarget from '../models/GestureTarget'

const cancelScrollType = 'touchmove'
const cancelScrollOptions = { passive: false }

const cancelWheelType = 'wheel'
const cancelWheelOptions = { passive: false }

const isColumnVisible = width => width > 0

const Point = (x, y) => ({ x, y })

const getClientX = element => element.getBoundingClientRect().x
const getClientY = element => element.getBoundingClientRect().y

function getLine(pointA, pointB) {
  const min = pointA < pointB ? pointA : pointB
  const max = pointA > pointB ? pointA : pointB

  return {
    origin: min,
    size: max - min
  }
}

function getRelativeOffset(absolute, origin, minVisible, maxVisible, scrollFactor) {
  const reference = _.clamp(absolute, minVisible, maxVisible)
  const scrollOffset = Math.floor((absolute - reference) * scrollFactor)

  return {
    scrollOffset,
    relToOrigin: reference - origin + scrollOffset,
    relToMin: reference - minVisible,
    relToMax: maxVisible - reference
  }
}

/**
 * Child of {@link Components.Root}.
 * Handles drag selection and column resizing
 *
 * @name Components.ScrollingContainer
 * @type {React.FC}
 */
function ScrollingContainer(props) {
  const {
    dragSelectScrollFactor,
    columnResizeScrollFactor,
    columns,
    initColumnWidths,
    onColumnResizeEnd,
    onItemsOpen,
    ...resizingProps
  } = props

  const {
    utils: { options, hooks, selectors, events },
    actions,
    placeholder
  } = props

  const gesture = useContext(GestureContext)

  const [dragMode, setDragMode] = useState(null)
  useLayoutEffect(() => {
    gesture.isDragging = !!dragMode
  }, [gesture, dragMode])

  //#region Redux state

  const rowCount = hooks.useSelector(s => s.rowKeys.length)
  const rowKeys = hooks.useSelector(s => s.rowKeys)
  const indexOffset = hooks.useSelector(selectors.getPageIndexOffset)
  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)
  const noSelection = hooks.useSelector(s => setUtils.isEmpty(s.selected))

  const getState = hooks.useGetState()

  //#endregion

  //#region Elements

  const tableBodyRef = useRef()
  const headColGroupRef = useRef()
  const headerRef = useRef()
  const selectionRectRef = useRef()
  const scrollingContainerRef = useRef()

  const getRow = useCallback(index => {
    const [table] = tableBodyRef.current.getElementsByTagName('table')
    return table.rows[index]
  }, [])

  const getCurrentHeaderWidths = useCallback(() =>
    _.map(_.take(headColGroupRef.current.children, columns.length), h => h.getBoundingClientRect().width),
  [columns])

  //#endregion

  //#region Column group

  const [columnGroup, setColumnGroup] = useState({
    widths: initColumnWidths,
    resizingIndex: -1
  })

  const getRenderedColumnsWidthsPatch = useCallback(widths =>
    _.zipObject(_.map(columns, 'key'), widths), [columns])

  const defaultWidths = useMemo(() => {
    const defaultWidth = 100 / columns.length
    const widths = _.map(columns, c => +c.defaultWidth || defaultWidth)
    return getRenderedColumnsWidthsPatch(widths)
  }, [columns, getRenderedColumnsWidthsPatch])

  const allWidths = useMemo(() => {
    // Fix invalid initial column widths state, that may have resulted from using version <5.1.1
    const validWidths = _.mapValues(columnGroup.widths,
      (width, key) => width || negative(defaultWidths[key]))

    return { ...defaultWidths, ...validWidths }
  }, [columnGroup, defaultWidths])

  const fullColumnGroup = useMemo(() => {
    // Negative widths (columns that were hidden using css at the time of the last resize),
    // should not contribute to the width of the container
    const visibleWidths = columns.map(c => allWidths[c.key]).filter(w => w >= 0)

    const { resizingIndex } = columnGroup
    const isResizing = resizingIndex >= 0

    return {
      resizingIndex,
      widths: _.mapValues(allWidths, Math.abs),
      containerWidth: isResizing ? 0 : Math.max(100, _.sum(visibleWidths)),
      widthUnit: isResizing ? px : pc
    }
  }, [columnGroup, columns, allWidths])

  const setRenderedColumnWidths = useCallback((widths, resizingIndex = -1) => {
    const renderedPatch = getRenderedColumnsWidthsPatch(widths)
    const visiblePatch = _.pickBy(renderedPatch, isColumnVisible)
    const hiddenPatch = _.mapValues(renderedPatch, (w, key) => negative(allWidths[key]))

    setColumnGroup({
      widths: _.defaults(visiblePatch, hiddenPatch, allWidths),
      resizingIndex
    })

    if (resizingIndex >= 0) return
    onColumnResizeEnd(visiblePatch)
  }, [getRenderedColumnsWidthsPatch, onColumnResizeEnd, allWidths])

  //#endregion

  //#region Drag states

  const drag = useRef({
    invertScroll: false,
    animationId: null,
    pointerPos: Point(),
    pointerId: null,
    movement: Point(0, 0)
  }).current

  const columnResizing = useRef({
    prevVisibleIndex: -1,
    sharedWidth: Infinity,
    maxWidth: Infinity,
    distanceToStart: 0,
    distanceToEnd: 0
  }).current

  const dragSelection = useRef({
    selection: {},
    selectionBuffer: {},
    originRel: Point(),
    activeIndex: null,
    pivotIndex: null,
    prevRowIndex: -1,
    prevRelY: 0
  }).current

  //#endregion

  //#region Drag ending

  // Column resizing
  const columnResizeEnd = useCallback(() => {
    // Account for end-cap border
    const { offsetWidth: availableWidth } = headColGroupRef.current
    const { lastChild: { offsetLeft: fullWidth } } = headerRef.current
    const { clientWidth: visibleWidth } = scrollingContainerRef.current

    const scale = fullWidth > visibleWidth ? fullWidth / availableWidth : 1
    const widths = getCurrentHeaderWidths().map(px => px / visibleWidth * scale * 100)

    setRenderedColumnWidths(widths)
  }, [getCurrentHeaderWidths, setRenderedColumnWidths])

  // Drag selection
  const dragSelectEnd = useCallback(() => {
    if (dragSelection.activeIndex == null) return
    actions.setSelected(
      _.mapKeys(dragSelection.selection, (_, rowIndex) => rowKeys[rowIndex]),
      dragSelection.activeIndex + indexOffset,
      dragSelection.pivotIndex + indexOffset
    )
  }, [dragSelection, actions, rowKeys, indexOffset])

  // Common
  const dragEnd = useMemo(() => ({
    [DragModes.Resize]: columnResizeEnd,
    [DragModes.Select]: dragSelectEnd
  })[dragMode], [dragMode, columnResizeEnd, dragSelectEnd])

  const dragStop = useCallback(() => {
    if (drag.pointerId != null) {
      scrollingContainerRef.current.releasePointerCapture(drag.pointerId)
      drag.pointerId = null
    }
    // Animation hasn't yet finished, we will be called again when it does
    if (drag.animationId != null) return

    dragEnd()
    setDragMode(null)
  }, [drag, dragEnd])

  //#endregion

  //#region Drag animation

  // Common
  const dragAnimate = useCallback((animation, ...params) => {
    cancelAnimationFrame(drag.animationId)
    drag.animationId = requestAnimationFrame(() => {
      animation(...params)
      drag.animationId = null
      drag.movement.x = 0
      drag.movement.y = 0

      // Drag ended while doing animation
      if (drag.pointerId == null) setTimeout(dragStop, 0)
    })
  }, [drag, dragStop])

  // Column resizing
  const columnResizeAnimation = useCallback((changedWidths, scrollLeft) => {
    const colGroup = headColGroupRef.current
    const container = scrollingContainerRef.current

    for (const index in changedWidths)
      colGroup.children[index].style.width = px(changedWidths[index])

    container.scrollLeft = scrollLeft
  }, [])

  const dragSelectAnimate = useCallback((
    relX, relY, scrollLeftOffset, scrollTopOffset
  ) => {
    // Animate scrolling
    const container = scrollingContainerRef.current
    container.scrollLeft += scrollLeftOffset
    container.scrollTop += scrollTopOffset

    // Animate rectangle
    const { originRel } = dragSelection
    const lineX = getLine(relX, originRel.x)
    const lineY = getLine(relY, originRel.y)

    Object.assign(selectionRectRef.current.style, _.mapValues({
      left: lineX.origin,
      width: lineX.size,
      top: lineY.origin,
      height: lineY.size
    }, px))

    // Animate selection
    _.forEach(dragSelection.selectionBuffer, (selected, index) => {
      getRow(index).toggleAttribute(StateAttributes.Selected, selected)
    })
    dragSelection.selectionBuffer = {}

    // Animate active row
    if (dragSelection.activeIndex == null) return

    const prevActiveRow = tableBodyRef.current.querySelector(flagAttributeSelector(StateAttributes.Active))
    prevActiveRow.toggleAttribute(StateAttributes.Active, false)

    const newActiveRow = getRow(dragSelection.activeIndex)
    newActiveRow.toggleAttribute(StateAttributes.Active, true)
  }, [dragSelection, getRow])

  //#endregion

  //#region Drag updating

  // Column resizing
  const columnResizeUpdate = useCallback(() => {
    const index = columnGroup.resizingIndex
    if (index < 0) return

    const {
      prevVisibleIndex,
      sharedWidth, maxWidth,
      distanceToEnd, distanceToStart
    } = columnResizing
    const { constantWidth, minColumnWidth: minWidth } = options

    const container = scrollingContainerRef.current
    const { scrollLeft: scroll, clientWidth: containerWidth } = container
    const containerX = getClientX(container)

    // Auto-scroll
    const shrinkThresholdColumn = !constantWidth && scroll ? containerWidth - distanceToEnd : 0
    const shrinkThreshold = containerX + Math.max(0, shrinkThresholdColumn)
    const expandThreshold = containerX + containerWidth

    const { relToOrigin: relX, scrollOffset } = getRelativeOffset(
      drag.pointerPos.x, getClientX(headColGroupRef.current.offsetParent),
      shrinkThreshold, expandThreshold, columnResizeScrollFactor
    )

    // Scroll with second finger
    let movementOffset = 0
    if (relX + distanceToEnd > containerWidth) {
      const availableScroll = maxWidth - containerWidth - scroll
      movementOffset = _.clamp(drag.movement.x, -scroll, availableScroll)
    }

    // Set column widths
    const targetWidth = relX - distanceToStart + movementOffset // scrollOffset is factored in to relX
    const newWidth = _.clamp(targetWidth, minWidth, sharedWidth - minWidth)
    const changedWidths = { [prevVisibleIndex]: newWidth }
    if (constantWidth)
      changedWidths[index] = sharedWidth - newWidth

    const newScroll = scroll + scrollOffset + movementOffset
    dragAnimate(columnResizeAnimation, changedWidths, newScroll)
  }, [
    drag,
    columnGroup,
    columnResizing,
    columnResizeAnimation,
    columnResizeScrollFactor,
    dragAnimate,
    options
  ])

  // Drag selection
  const dragSelectUpdate = useCallback(() => {
    // Calculate selection rectangle
    const body = tableBodyRef.current
    const container = scrollingContainerRef.current
    const containerBounds = container.getBoundingClientRect()

    const visibleTop = containerBounds.top + body.offsetTop
    const visibleLeft = containerBounds.left
    const visibleRight = containerBounds.left + container.clientWidth
    const visibleBottom = containerBounds.top + container.clientHeight

    const { pointerPos, movement } = drag

    const { relToOrigin: relX, scrollOffset: scrollLeftOffset, relToMin: left, relToMax: right } =
            getRelativeOffset(pointerPos.x, getClientX(body),
              visibleLeft, visibleRight, dragSelectScrollFactor)

    const { relToOrigin: relY, scrollOffset: scrollTopOffset, relToMin: top, relToMax: bottom } =
            getRelativeOffset(pointerPos.y, getClientY(body),
              visibleTop, visibleBottom, dragSelectScrollFactor)

    // Calculate selection
    const availableHeight = container.scrollHeight - body.offsetTop
    const newRelY = _.clamp(relY + movement.y, top, availableHeight - bottom)
    const newRelX = _.clamp(relX + movement.x, left, container.scrollWidth - right)

    const { selectionBuffer, originRel: { y: originRelY } } = dragSelection
    const direction = Math.sign(newRelY - dragSelection.prevRelY)

    if (direction) {
      const shouldBeSelected = top =>
        Math.sign(top - originRelY) === direction &&
        Math.sign(newRelY - originRelY) === direction

      const couldBeSelected = (index, bounds) => {
        if (index === rowCount)
        // Can't use _.inRange as it swaps the limits
          return newRelY > body.offsetHeight && newRelY < originRelY

        return bounds && (direction > 0 ? bounds.top <= newRelY : bounds.bottom >= newRelY)
      }

      for (
        let rowBounds, rowIndex = dragSelection.prevRowIndex + direction;
        couldBeSelected(rowIndex, rowBounds = getRowBounds(getRow(rowIndex)));
        rowIndex += direction
      ) {
        // rowIndex is the last row that should be selected
        const selected = rowBounds && shouldBeSelected(rowBounds.top)
        const rowToUpdate = selected ? rowIndex : dragSelection.prevRowIndex
        selectionBuffer[rowToUpdate] = selected
        dragSelection.prevRowIndex = rowIndex

        getSelection().removeAllRanges()

        if (rowIndex >= rowCount) continue
        dragSelection.activeIndex = rowIndex
        dragSelection.pivotIndex ??= rowIndex
      }

      dragSelection.prevRelY = newRelY
      Object.assign(dragSelection.selection, selectionBuffer)
    }

    dragAnimate(dragSelectAnimate,
      newRelX, newRelY,
      scrollLeftOffset + movement.x,
      scrollTopOffset + movement.y
    )
  }, [drag, dragSelectScrollFactor, dragSelection, dragAnimate, dragSelectAnimate, rowCount, getRow])

  // Common
  const dragUpdate = useMemo(() => ({
    [DragModes.Resize]: columnResizeUpdate,
    [DragModes.Select]: dragSelectUpdate
  })[dragMode], [dragMode, columnResizeUpdate, dragSelectUpdate])

  //#endregion

  //#region Drag starting

  // Common
  const cancelScrollHandler = useDecoupledCallback(useCallback(e => {
    if (e.cancelable)
      e.preventDefault()
    else if (drag.pointerId != null) // Stop dragging if browser gesture is in progress
      dragStop()
  }, [drag, dragStop]))

  const cancelWheelHandler = useDecoupledCallback(useCallback(e => {
    e.preventDefault()

    const invertScroll = e.shiftKey !== drag.invertScroll
    drag.movement.x += invertScroll ? e.deltaY : e.deltaX
    drag.movement.y += invertScroll ? e.deltaX : e.deltaY

    dragUpdate()
  }, [drag, dragUpdate]))

  const dragStart = useCallback((x, y, pointerId, mode, invertScroll = false) => {
    Object.assign(drag, {
      pointerPos: Point(x, y),
      pointerId,
      invertScroll
    })

    const container = scrollingContainerRef.current
    try {
      container.setPointerCapture(pointerId)
    } catch {
      drag.pointerId = null
      return false
    }
    window.addEventListener(cancelScrollType, cancelScrollHandler, cancelScrollOptions)
    window.addEventListener(cancelWheelType, cancelWheelHandler, cancelWheelOptions)

    setDragMode(mode)
    return true
  }, [drag, cancelScrollHandler, cancelWheelHandler])

  useEffect(() => {
    if (dragMode) return

    window.removeEventListener(cancelScrollType, cancelScrollHandler, cancelScrollOptions)
    window.removeEventListener(cancelWheelType, cancelWheelHandler, cancelWheelOptions)
  }, [dragMode, cancelScrollHandler, cancelWheelHandler])

  // Column resizing
  const columnResizeStart = useCallback((x, y, pointerId, index) => {
    if (!dragStart(x, y, pointerId, DragModes.Resize, true)) return

    const widths = getCurrentHeaderWidths()
    const prevVisibleIndex = _.findLastIndex(widths, isColumnVisible, index - 1)

    const {
      lastChild: { offsetLeft: contentWidth },
      children: { [prevVisibleIndex]: prevHeader, [index]: header }
    } = headerRef.current

    Object.assign(columnResizing, {
      prevVisibleIndex,
      sharedWidth: options.constantWidth ? widths[prevVisibleIndex] + widths[index] : Infinity,
      maxWidth: options.constantWidth ? contentWidth : Infinity,
      distanceToStart: prevHeader.offsetLeft + prevHeader.clientLeft,
      distanceToEnd: header ? contentWidth - (header.offsetLeft + header.clientLeft) : 0
    })

    // When a column starts being resized, the width of the spacer is set to 100vw,
    // and when the container is scrolled beyond content-width, the body stops scrolling with it (position: sticky)
    // as the only thing visible at this point is the spacer.
    // This is a performance optimization because having the entire body expand to the header's size is pointless.
    const body = tableBodyRef.current
    body.style.setProperty('--content-width', px(contentWidth))

    setRenderedColumnWidths(widths, index)
  }, [dragStart, getCurrentHeaderWidths, columnResizing, options, setRenderedColumnWidths])

  // Drag selection
  const dragSelectStart = useCallback((x, y, pointerId, rowIndex) => {
    if (!options.multiSelect) return
    if (!dragStart(x, y, pointerId, DragModes.Select)) return

    const body = tableBodyRef.current
    const relX = x - getClientX(body)
    const relY = y - getClientY(body)

    Object.assign(dragSelection, {
      selection: {},
      activeIndex: null,
      pivotIndex: rowIndex < 0 ? null : rowIndex,
      prevRowIndex: rowIndex < 0 ? rowCount : rowIndex,
      prevRelY: relY,
      originRel: Point(relX, relY)
    })
  }, [dragStart, dragSelection, rowCount, options])

  //#endregion

  //#region Drag Event handlers

  const handleScroll = useCallback(() => {
    if (drag.pointerId == null) return
    dragUpdate?.()
  }, [drag, dragUpdate])

  const handlePointerMove = useCallback(e => {
    if (drag.pointerId == null) return
    if (e.pointerId === drag.pointerId)
      drag.pointerPos = Point(e.clientX, e.clientY)
    else {
      drag.movement.x -= e.movementX
      drag.movement.y -= e.movementY
    }

    dragUpdate?.()
  }, [drag, dragUpdate])

  const handlePointerEnd = useCallback(e => {
    if (drag.pointerId == null) return
    if (e.pointerId !== drag.pointerId) return
    dragStop()
  }, [drag, dragStop])

  //#endregion

  //#region Autoscroll to active index

  const getContainerVisibleBounds = useCallback(() => {
    const container = scrollingContainerRef.current
    const body = tableBodyRef.current
    return {
      top: container.scrollTop,
      bottom: container.scrollTop + container.clientHeight - body.offsetTop
    }
  }, [scrollingContainerRef, tableBodyRef])

  useLayoutEffect(() => {
    const activeRow = getRow(activeRowIndex)
    if (!activeRow) return

    const containerBounds = getContainerVisibleBounds()
    const rowBounds = getRowBounds(activeRow)
    const distanceToTop = rowBounds.top - containerBounds.top
    const distanceToBottom = rowBounds.bottom - containerBounds.bottom

    const scrollOffset = Math.min(0, distanceToTop) + Math.max(0, distanceToBottom)
    scrollingContainerRef.current.scrollTop += scrollOffset
  }, [
    activeRowIndex,
    getRow, getContainerVisibleBounds
  ])

  //#endregion

  //#region Gesture actions

  const showPlaceholder = !!placeholder

  const dragSelect = useDecoupledCallback(useCallback(e => {
    if (gesture.pointerId == null) return
    dragSelectStart(e.clientX, e.clientY, gesture.pointerId, gesture.target.index)
  }, [gesture, dragSelectStart]))

  const columnResize = useDecoupledCallback(useCallback(e => {
    if (gesture.pointerId == null) return
    columnResizeStart(e.clientX, e.clientY, gesture.pointerId, gesture.target.index)
  }, [gesture, columnResizeStart]))

  const contextMenu = useDecoupledCallback(useCallback(e => {
    const { target } = gesture

    if (showPlaceholder)
      events.contextMenu(getState(), true)
    else if (e.altKey)
      events.contextMenu(getState(), !e.ctrlKey)
    else if (target.type === GestureTargetTypes.Header)
      events.contextMenu(getState(), true)
    else if (target.type === GestureTargetTypes.BelowRows) {
      if (e.shiftKey)
        actions.withContextMenu.select(indexOffset + rowCount - 1, e.shiftKey, e.ctrlKey)
      else if (!options.listBox && !e.ctrlKey)
        actions.withContextMenu.clearSelection()
      else
        events.contextMenu(getState(), !e.ctrlKey, true)
    } else if (options.listBox && e.ctrlKey)
      events.contextMenu(getState(), false, true)
    else if (options.listBox || (selectors.getSelected(getState(), target.index) && !e.ctrlKey))
      actions.withContextMenu.setActive(indexOffset + target.index)
    else
      actions.withContextMenu.select(indexOffset + target.index, e.shiftKey, e.ctrlKey)

    return false // Prevent other dual-tap gestures
  }, [gesture, events, options, rowCount, actions, indexOffset, getState, selectors, showPlaceholder]))

  const itemsOpen = useDecoupledCallback(useCallback(e => {
    if (showPlaceholder || e.ctrlKey || noSelection) return
    onItemsOpen(selectors.getSelectionArg(getState()), false)
    return false // Prevent other dual-tap gestures
  }, [noSelection, showPlaceholder, onItemsOpen, selectors, getState]))

  //#endregion

  // Set props
  Object.assign(resizingProps, {
    tableBodyRef,
    headColGroupRef,
    selectionRectRef,
    headerRef,

    columns,
    dragMode,
    dragSelect,
    itemsOpen,
    contextMenu,
    columnResize
  })

  return <div
    className='rst-scrollingContainer'
    ref={scrollingContainerRef}
    data-drag-mode={dragMode}
    {...dataAttributeFlags({ 'placeholder-shown': showPlaceholder })}
    onScroll={handleScroll}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerEnd}
    onPointerCancel={handlePointerEnd}
  >
    <ColumnGroupContext.Provider value={fullColumnGroup}>
      <ResizingContainer {...resizingProps}
        gestureTarget={GestureTarget(GestureTargetTypes.BelowRows)}
        onDualTap={itemsOpen}
        onDualTapDirect={contextMenu}
      />
    </ColumnGroupContext.Provider>
  </div>
}

export default ScrollingContainer
