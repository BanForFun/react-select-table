import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import ScrollingContainer from './ScrollingContainer'
import PaginationContainer from './PaginationWrapper'
import SearchContainer from './SearchContainer'
import classNames from 'classnames'
import { GestureTargets } from '../constants/enums'
import * as setUtils from '../utils/setUtils'
import GestureContext from '../context/GestureTarget'
import useDecoupledCallback from '../hooks/useDecoupledCallback'

const parseColumn = col => ({
  render: value => value,
  key: col.path,
  ...col
})

const internalActionMetadata = { internal: true }

/**
 * Child of {@link Components.Table}.
 * Child of {@link Components.SlaveTable}.
 *
 * @name Components.Root
 * @type {React.FC}
 */
function Root(props) {
  const {
    paginationComponent, // PaginationContainer
    containerRef,
    id,
    className,
    autoFocus,
    loadingIndicator,
    emptyPlaceholder,
    errorComponent,
    onKeyDown,
    columns,
    ...scrollingProps
  } = props

  const {
    utils: { hooks, selectors, events, options },
    onItemsOpen
  } = props

  // Focus on container
  useEffect(() => {
    if (!autoFocus) return
    containerRef.current.focus()
  }, [containerRef, autoFocus])

  const internalActions = hooks.useActions(internalActionMetadata)
  const internalContextMenuActions = hooks.useActions({ ...internalActionMetadata, contextMenu: true })
  const actions = useMemo(() => ({
    ...internalActions,
    withContextMenu: internalContextMenuActions
  }), [internalActions, internalContextMenuActions])

  const searchInputRef = useRef()

  const pageIndex = hooks.useSelector(selectors.getPageIndex)
  const pageCount = hooks.useSelector(selectors.getPageCount)
  const indexOffset = hooks.useSelector(selectors.getPageIndexOffset)
  const activeIndex = hooks.useSelector(s => s.activeIndex)
  const pageSize = hooks.useSelector(s => s.pageSize)
  const isLoading = hooks.useSelector(s => s.isLoading)
  const error = hooks.useSelector(s => s.error)
  const itemCount = hooks.useSelector(s => s.visibleItemCount)
  const rowCount = hooks.useSelector(s => s.rowKeys.length)
  const noSelection = hooks.useSelector(s => setUtils.isEmpty(s.selected))

  const getState = hooks.useGetState()

  const isEmpty = !itemCount

  const placeholder = useMemo(() => {
    if (isLoading)
      return loadingIndicator

    if (error) {
      const Error = errorComponent
      return <Error>{error}</Error>
    }

    if (isEmpty)
      return emptyPlaceholder
  }, [
    isLoading, error, isEmpty,
    loadingIndicator, emptyPlaceholder, errorComponent
  ])

  const showPlaceholder = !!placeholder

  //#region Keyboard shortcuts
  const selectionRegisteredRef = useRef(false)
  useEffect(() => {
    requestAnimationFrame(() => {
      selectionRegisteredRef.current = true
    })
  }, [activeIndex])

  const select = useCallback((e, index, defaultSetActive = false) => {
    // Don't change selection faster than it can be rendered
    if (!selectionRegisteredRef.current) return
    selectionRegisteredRef.current = false

    if ((defaultSetActive || e.ctrlKey) && !e.shiftKey)
      return actions.setActive(index)

    return actions.select(index, e.shiftKey, e.ctrlKey)
  }, [actions])

  const handleShortcuts = useCallback(e => {
    if (showPlaceholder) return false
    if (onKeyDown(e, selectors.getSelectionArg(getState())) === false) return false

    const isPageFirst = pageIndex === 0
    const isPageLast = pageIndex === pageCount - 1
    const isActiveFirst = activeIndex === 0
    const isActiveLast = activeIndex === itemCount - 1

    // React doesn't have a code property, and the key property is case-sensitive so keyCode it is
    switch (e.keyCode) {
      case 38: // Up
        if (isActiveFirst) return
        select(e, activeIndex - 1)
        break
      case 40: // Down
        if (isActiveLast) return
        select(e, activeIndex + 1)
        break
      case 37: // Left
        if (isPageFirst) return
        select(e, activeIndex - pageSize, true)
        break
      case 39: // Right
        if (isPageLast) return
        select(e, Math.min(activeIndex + pageSize, itemCount - 1), true)
        break
      case 36: // Home
        if (isActiveFirst) return
        select(e, 0)
        break
      case 35: // End
        if (isActiveLast) return
        select(e, itemCount - 1)
        break
      case 13: // Enter
        if (
          !e.ctrlKey && !e.shiftKey &&
          selectors.getSelected(getState(), selectors.getActiveRowIndex(getState()))
        )
          onItemsOpen(selectors.getSelectionArg(getState()), true)
        else
          actions.select(activeIndex, e.shiftKey, e.ctrlKey)

        break
      case 65: // A
        if (!e.ctrlKey || e.shiftKey) return
        actions.selectAll()
        break
      default:
        if (e.ctrlKey || e.shiftKey) return false
        return
    }

    e.preventDefault()
    return false
  }, [
    actions, selectors, getState,
    onKeyDown, onItemsOpen,
    showPlaceholder,
    activeIndex, itemCount, pageSize, pageCount, pageIndex, // Redux props
    select // Component methods
  ])

  const handleKeyDown = useCallback(e => {
    if (handleShortcuts(e) === false) return
    searchInputRef.current.focus()
  }, [handleShortcuts, searchInputRef])
  //#endregion

  //#region Touch gestures

  const gesture = useRef({
    pointerId: null,
    target: null,
    pointerType: null,
    isDragging: false
  }).current

  const contextMenu = useDecoupledCallback(useCallback(e => {
    const { target } = gesture

    if (showPlaceholder)
      events.contextMenu(getState(), true)
    else if (e.altKey)
      events.contextMenu(getState(), !e.ctrlKey)
    else if (target === GestureTargets.Header)
      events.contextMenu(getState(), true)
    else if (target === GestureTargets.BelowItems) {
      if (e.shiftKey)
        actions.withContextMenu.select(indexOffset + rowCount - 1, e.shiftKey, e.ctrlKey)
      else if (!options.listBox && !e.ctrlKey)
        actions.withContextMenu.clearSelection()
      else
        events.contextMenu(getState(), !e.ctrlKey, true)
    } else if (options.listBox && e.ctrlKey)
      events.contextMenu(getState(), false, true)
    else if (options.listBox || (selectors.getSelected(getState(), target) && !e.ctrlKey))
      actions.withContextMenu.setActive(indexOffset + target)
    else
      actions.withContextMenu.select(indexOffset + target, e.shiftKey, e.ctrlKey)

    return false // Prevent other dual-tap gestures
  }, [gesture, events, options, rowCount, actions, indexOffset, getState, selectors, showPlaceholder]))

  const itemsOpen = useDecoupledCallback(useCallback(e => {
    if (e.ctrlKey || noSelection || showPlaceholder) return
    onItemsOpen(selectors.getSelectionArg(getState()), false)
    return false // Prevent other dual-tap gestures
  }, [noSelection, showPlaceholder, onItemsOpen, selectors, getState]))

  const handlePointerDown = useCallback(e => {
    gesture.pointerType = e.pointerType
    gesture.pointerId = e.isPrimary ? e.pointerId : null
  }, [gesture])

  //#endregion

  // Scrolling container props
  Object.assign(scrollingProps, {
    actions,
    placeholder,
    contextMenu,
    itemsOpen
  })

  // Pagination container props
  const paginationProps = {
    utils: props.utils,
    actions,
    paginationComponent
  }

  const searchProps = {
    utils: props.utils,
    actions,
    inputRef: searchInputRef
  }

  return <div
    tabIndex={0}
    id={id}
    ref={containerRef}
    onKeyDown={handleKeyDown}
    onPointerDown={handlePointerDown}
    className={classNames('rst-container', className)}
  >
    <GestureContext.Provider value={gesture}>
      <SearchContainer {...searchProps} />
      <ScrollingContainer {...scrollingProps}
        columns={columns.map(parseColumn)}
        gestureTarget={GestureTargets.BelowItems}
        onDualTap={itemsOpen}
        onDualTapDirect={contextMenu}
      />
      {!showPlaceholder && pageCount > 1 &&
        <PaginationContainer {...paginationProps} />}
    </GestureContext.Provider>
  </div>
}

export default Root
