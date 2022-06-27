import _ from 'lodash'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ResizingContainer from './ResizingContainer'
import { pc, px } from '../utils/tableUtils'
import useDecoupledCallback from '../hooks/useDecoupledCallback'
import { ActiveClass, getRowBounds, SelectedClass } from './TableRow'
import ColumnGroupContext from '../context/ColumnGroup'
import * as selectors from '../selectors/selectors'
import { DragModes } from '../constants/enums'
import { setChunkVisibility } from './TableChunk'

const defaultColumnRenderer = value => value

const parseColumn = col => ({
  render: defaultColumnRenderer,
  key: col.path,
  ...col
})

const cancelScrollType = 'touchmove'
const cancelScrollOptions = { passive: false }

const cancelWheelType = 'wheel'
const cancelWheelOptions = { passive: false }

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
  const scrollOffset = (absolute - reference) * scrollFactor

  return {
    scrollOffset,
    relToOrigin: Math.floor(reference - origin + scrollOffset),
    relToMin: reference - minVisible,
    relToMax: maxVisible - reference
  }
}

// Child of Root
// Handles drag selection and column resizing
function ScrollingContainer(props) {
  const {
    dragSelectScrollFactor,
    columnResizeScrollFactor,
    columns: unorderedColumns,
    columnOrder,
    ...resizingProps
  } = props

  const {
    utils: { options, hooks, events },
    actions
  } = props

  //#region Column group

  const columns = useMemo(() =>
    (columnOrder?.map(index => unorderedColumns[index]) ?? unorderedColumns).map(parseColumn),
  [unorderedColumns, columnOrder])

  const defaultWidths = useMemo(() => {
    const columnCount = columns.length
    const defaultWidth = 100 / columnCount
    return columns.map(c => c.defaultWidth ?? defaultWidth)
  }, [columns])

  const getColumnGroup = useCallback(widths => {
    const containerWidth = Math.max(100, _.sum(widths))
    const containerMinWidth = containerWidth / _.min(widths) * options.minColumnWidth

    return {
      widths: widths.map(pc),
      containerWidth: pc(containerWidth),
      containerMinWidth: px(containerMinWidth)
    }
  }, [options])

  const [columnGroup, setColumnGroup] = useState(getColumnGroup(defaultWidths))

  useEffect(() => {
    setColumnGroup(getColumnGroup(defaultWidths))
  }, [getColumnGroup, defaultWidths])

  //#endregion

  //#region Elements

  const tableBodyRef = useRef()
  const tableHeaderRowRef = useRef()
  const selectionRectRef = useRef()
  const scrollingContainerRef = useRef()
  const resizingContainerRef = useRef()

  const getChunkRow = useCallback(index => {
    const rowIndex = index % options.chunkSize
    const chunkIndex = (index - rowIndex) / options.chunkSize

    const chunk = tableBodyRef.current.children[chunkIndex]
    if (chunk?.tagName !== 'TABLE') return null

    return { row: chunk.rows[rowIndex], chunk }
  }, [options])

  //#endregion

  //#region Drag states

  const [dragMode, setDragMode] = useState(null)
  const drag = useRef({
    animationId: null,
    pointerPos: Point(),
    pointerId: null,
    movement: Point(0, 0)
  }).current

  const columnResizing = useRef({
    widths: [],
    initialWidth: 0,
    index: -1,
    borderLeft: 0,
    borderRight: 0
  }).current

  const dragSelection = useRef({
    selection: {},
    selectionBuffer: {},
    activeIndex: null,
    pivotIndex: null,
    prevRowIndex: -1,
    prevRelY: 0
  }).current

  //#endregion

  //#region Drag ending

  // Column resizing
  const raiseColumnResizeEnd = hooks.useSelectorGetter(events.columnResizeEnd)
  const columnResizeEnd = useCallback(() => {
    // Account for collapsed border
    const {
      clientWidth: availableWidth,
      offsetParent: { clientWidth: fullWidth }
    } = tableHeaderRowRef.current

    const bodyWidthPc = fullWidth / scrollingContainerRef.current.clientWidth * 100
    const widths = columnResizing.widths.map(px => px / availableWidth * bodyWidthPc)

    raiseColumnResizeEnd(widths)
    setColumnGroup(getColumnGroup(widths))
  }, [columnResizing, setColumnGroup, getColumnGroup, raiseColumnResizeEnd])

  // Drag selection
  const rowKeys = hooks.useSelector(s => s.rowKeys)
  const indexOffset = hooks.useSelector(selectors.getPageIndexOffset)
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
    const headerRow = tableHeaderRowRef.current
    const container = scrollingContainerRef.current

    for (const index in changedWidths)
      headerRow.children[index].style.width = px(changedWidths[index])

    // resizingContainerRef.current.style.width = px(Math.max(100, _.sum(columnResizing.widths)));

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
      getChunkRow(index).row.classList.toggle(SelectedClass, selected)
    })
    dragSelection.selectionBuffer = {}

    // Animate active row
    if (dragSelection.activeIndex == null) return

    const [prevActiveRow] = tableBodyRef.current.getElementsByClassName(ActiveClass)
    prevActiveRow.classList.remove(ActiveClass)

    const newActiveRow = getChunkRow(dragSelection.activeIndex).row
    newActiveRow.classList.add(ActiveClass)
  }, [dragSelection, getChunkRow])

  //#endregion

  //#region Drag updating

  // Column resizing
  const columnResizeUpdate = useCallback(() => {
    const index = columnGroup.resizingIndex
    if (index == null) return

    const { widths, borderLeft, borderRight } = columnResizing
    const { constantWidth, minColumnWidth: minWidth } = options

    const container = scrollingContainerRef.current
    let { clientWidth: containerWidth, scrollLeft } = container
    containerWidth -= borderLeft + borderRight
    const containerX = getClientX(container) + borderLeft

    // Auto-scroll
    const distanceToEnd = _.sum(_.slice(widths, index + 1))
    const shrinkThresholdColumn = scrollLeft && widths[index] > minWidth
      ? containerWidth - distanceToEnd : 0
    const shrinkThreshold = containerX + Math.max(0, shrinkThresholdColumn)
    const expandThreshold = containerX + containerWidth

    const { relToOrigin: relX, scrollOffset } = getRelativeOffset(
      drag.pointerPos.x, getClientX(tableHeaderRowRef.current),
      shrinkThreshold, expandThreshold, columnResizeScrollFactor
    )

    // Scroll with second finger
    let movementOffset = 0
    if (relX + distanceToEnd > containerWidth) {
      const availableScroll = constantWidth
        ? columnResizing.initialWidth - containerWidth - scrollLeft : Infinity

      movementOffset = _.clamp(drag.movement.x, -scrollLeft, availableScroll)
    }

    // Set column widths
    const availableWidth = constantWidth ? widths[index] + widths[index + 1] : Infinity
    const left = _.sum(_.take(widths, index))
    const targetWidth = relX + movementOffset - left

    const changedWidths = {}
    changedWidths[index] = _.clamp(targetWidth, minWidth, availableWidth - minWidth)

    if (constantWidth)
      changedWidths[index + 1] = availableWidth - changedWidths[index]

    // Handle overscroll
    const overscroll = targetWidth !== changedWidths[index]
    const absPos = _.clamp(drag.pointerPos.x - containerX, 0, containerWidth)
    scrollLeft = !overscroll && (scrollOffset || movementOffset)
      ? left + changedWidths[index] - absPos
      : scrollLeft + scrollOffset + movementOffset

    Object.assign(columnResizing.widths, changedWidths)

    dragAnimate(columnResizeAnimation, changedWidths, scrollLeft)
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
  const rowCount = hooks.useSelector(s => s.rowKeys.length)
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
        couldBeSelected(rowIndex, rowBounds = getRowBounds(getChunkRow(rowIndex)?.row));
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
      _.clamp(relX + movement.x, left, body.clientWidth - right),
      newRelY,
      scrollLeftOffset + movement.x,
      scrollTopOffset + movement.y
    )
  }, [drag, dragSelectScrollFactor, dragSelection, dragAnimate, dragSelectAnimate, rowCount, getChunkRow])

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

    drag.movement.x += e.shiftKey ? e.deltaY : e.deltaX
    drag.movement.y += e.shiftKey ? e.deltaX : e.deltaY

    dragUpdate()
  }, [drag, dragUpdate]))

  const dragStart = useCallback((x, y, pointerId, mode) => {
    Object.assign(drag, { pointerPos: Point(x, y), pointerId })

    const container = scrollingContainerRef.current
    try {
      container.setPointerCapture(pointerId)
    } catch {
      drag.pointerId = null
      return false
    }
    container.addEventListener(cancelScrollType, cancelScrollHandler, cancelScrollOptions)
    container.addEventListener(cancelWheelType, cancelWheelHandler, cancelWheelOptions)

    setDragMode(mode)
    return true
  }, [drag, cancelScrollHandler, cancelWheelHandler])

  useEffect(() => {
    if (dragMode) return

    const container = scrollingContainerRef.current
    container.removeEventListener(cancelScrollType, cancelScrollHandler, cancelScrollOptions)
    container.removeEventListener(cancelWheelType, cancelWheelHandler, cancelWheelOptions)
  }, [dragMode, cancelScrollHandler, cancelWheelHandler])

  // Column resizing
  const columnResizeStart = useCallback((x, y, pointerId, index) => {
    if (!dragStart(x, y, pointerId, DragModes.Resize)) return

    const {
      offsetWidth: initialWidth,
      children: headers,
      lastChild: spacer
    } = tableHeaderRowRef.current

    const widths = _.initial(_.map(headers, h => h.getBoundingClientRect().width))
    const { clientLeft, clientWidth } = headers[index]

    Object.assign(columnResizing, {
      widths,
      initialWidth,
      borderLeft: clientLeft,
      borderRight: widths[index] - clientWidth - clientLeft
    })

    const body = tableBodyRef.current
    body.style.setProperty('--spacer-left', px(spacer.offsetLeft + spacer.clientLeft))

    setColumnGroup(columnGroup => ({
      ...columnGroup,
      widths: columnResizing.widths.map(px),
      containerWidth: 'fit-content',
      containerMinWidth: '0px',
      resizingIndex: index
    }))
  }, [dragStart, columnResizing])

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

  //#region Event handlers

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

  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  useLayoutEffect(() => {
    const chunkRow = getChunkRow(activeRowIndex)
    if (!chunkRow) return

    const containerBounds = getContainerVisibleBounds()
    const rowBounds = getRowBounds(chunkRow.row)
    const distanceToTop = rowBounds.top - containerBounds.top
    const distanceToBottom = rowBounds.bottom - containerBounds.bottom

    const scrollOffset = Math.min(0, distanceToTop) + Math.max(0, distanceToBottom)
    scrollingContainerRef.current.scrollTop += scrollOffset
  }, [activeRowIndex, getChunkRow, getContainerVisibleBounds, scrollingContainerRef])

  //#endregion

  //#region Chunk IntersectionObserver

  const chunkVisibilityRef = useRef({})

  // Chrome's content-visibility has worse performance
  const chunkIntersectionObserverRef = useRef()
  useLayoutEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const { target: chunk, isIntersecting: visibility } = entry
      chunkVisibilityRef.current[chunk.dataset.index] = visibility
      setChunkVisibility(chunk, visibility)
    }), { root: scrollingContainerRef.current, rootMargin: '500px' })

    chunkIntersectionObserverRef.current = observer
    return () => observer.disconnect()
  }, [])

  //#endregion

  // Set props
  Object.assign(resizingProps, {
    tableBodyRef,
    tableHeaderRowRef,
    selectionRectRef,
    scrollingContainerRef,
    resizingContainerRef,
    chunkIntersectionObserverRef,

    dragMode,
    columns,
    chunkVisibilityRef,

    columnResizeStart,
    dragSelectStart
  })

  return <div
    className='rst-scrollingContainer'
    ref={scrollingContainerRef}
    data-dragmode={dragMode}
    onScroll={handleScroll}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerEnd}
    onPointerCancel={handlePointerEnd}
  >
    <ColumnGroupContext.Provider value={columnGroup}>
      <ResizingContainer {...resizingProps} />
    </ColumnGroupContext.Provider>
  </div>
}

export default ScrollingContainer
