import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import ScrollingContainer from './ScrollingContainer'
import PaginationContainer from './PaginationWrapper'
import SearchContainer from './SearchContainer'
import * as selectors from '../selectors'

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
    ...scrollingProps
  } = props

  const {
    utils: { hooks, events }
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

  const getSelected = hooks.useSelectorGetter(selectors.getSelected)

  const raiseItemsOpen = hooks.useSelectorGetter(events.itemsOpen)
  const raiseContextMenu = hooks.useSelectorGetter(events.contextMenu)
  const raiseKeyDown = hooks.useSelectorGetter(events.keyDown)

  const isEmpty = !itemCount

  const placeholderContent = useMemo(() => {
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

  const placeholder = useMemo(() => {
    if (!placeholderContent) return

    const props = { className: 'rst-bodyPlaceholder' }
    if (isEmpty)
      props.onContextMenu = () => raiseContextMenu()

    return <div {...props}>{placeholderContent}</div>
  }, [placeholderContent, isEmpty, raiseContextMenu])

  const placeholderShown = !!placeholder

  const select = useCallback((e, index) => {
    if (e.ctrlKey && !e.shiftKey)
      return actions.setActive(index)

    return actions.select(index, e.shiftKey, e.ctrlKey)
  }, [actions])

  const handleShortcuts = useCallback(e => {
    if (placeholderShown) return false
    if (raiseKeyDown(e) === false) return false

    const isPageFirst = pageIndex === 0
    const isPageLast = pageIndex === pageCount - 1
    const isActiveFirst = activeIndex === 0
    const isActiveLast = activeIndex === itemCount - 1

    // React doesn't have a code property, and the key property is case sensitive so keyCode it is
    switch (e.keyCode) {
      case 38: // Up
        if (!isActiveFirst) select(e, activeIndex - 1)
        break
      case 40: // Down
        if (!isActiveLast) select(e, activeIndex + 1)
        break
      case 37: // Left
        if (!isPageFirst) select(e, activeIndex - pageSize)
        break
      case 39: // Right
        if (!isPageLast) select(e, Math.min(activeIndex + pageSize, itemCount - 1))
        break
      case 36: // Home
        if (!isActiveFirst) select(e, 0)
        break
      case 35: // End
        if (!isActiveLast) select(e, itemCount - 1)
        break
      case 13: // Enter
        if (!e.ctrlKey && !e.shiftKey && getSelected(activeIndex))
          raiseItemsOpen(true)
        else
          actions.select(activeIndex, e.shiftKey, e.ctrlKey)

        break
      case 65: // A
        if (e.ctrlKey && !e.shiftKey)
          actions.selectAll()
        break
      default:
        if (e.ctrlKey || e.shiftKey) return false
        return
    }

    e.preventDefault()
    return false
  }, [
    actions, placeholderShown,
    activeIndex, itemCount, getSelected, // Redux props
    pageSize, pageCount, pageIndex, // Redux props
    select, // Component methods
    raiseItemsOpen, raiseKeyDown // Event handlers
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
    paginationComponent,
    placeholderShown
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
    <ScrollingContainer {...scrollingProps} />
    {!placeholderShown && !!pageSize && <PaginationContainer {...paginationProps} />}
  </div>
}

export default Root
