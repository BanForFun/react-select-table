import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import ScrollingContainer from './ScrollingContainer'
import PaginationContainer from './PaginationWrapper'
import SearchContainer from './SearchContainer'

const parseColumn = col => ({
  render: value => value,
  key: col.path,
  ...col
})

// Child of Connector
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
    columns,
    ...scrollingProps
  } = props

  const {
    utils: { hooks, events, selectors }
  } = props

  // Focus on container
  useEffect(() => {
    if (!autoFocus) return
    containerRef.current.focus()
  }, [containerRef, autoFocus])

  const actions = hooks.useActions()

  const searchInputRef = useRef()

  const pageIndex = hooks.useSelector(selectors.getPageIndex)
  const pageCount = hooks.useSelector(selectors.getPageCount)
  const activeIndex = hooks.useSelector(s => s.activeIndex)
  const pageSize = hooks.useSelector(s => s.pageSize)
  const isLoading = hooks.useSelector(s => s.isLoading)
  const error = hooks.useSelector(s => s.error)
  const itemCount = hooks.useSelector(s => s.visibleItemCount)

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
    if (events.keyDown(getState(), e) === false) return false

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
          events.itemsOpen(getState(), true)
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
    actions, events, selectors, getState,
    showPlaceholder,
    activeIndex, itemCount, pageSize, pageCount, pageIndex, // Redux props
    select // Component methods
  ])

  const handleKeyDown = useCallback(e => {
    if (handleShortcuts(e) === false) return
    searchInputRef.current.focus()
  }, [handleShortcuts, searchInputRef])

  // Scrolling container props
  Object.assign(scrollingProps, {
    actions,
    placeholder
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
    className={'rst-container ' + className}
  >
    <SearchContainer {...searchProps} />
    <ScrollingContainer {...scrollingProps} columns={columns.map(parseColumn)} />
    {!showPlaceholder && pageCount > 1 &&
      <PaginationContainer {...paginationProps} />}
  </div>
}

export default Root
