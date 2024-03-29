import _ from 'lodash'
import React, { useCallback } from 'react'

/**
 * Child of {@link Components.Root}.
 *
 * @name Components.PaginationWrapper
 * @type {React.FC}
 */
function PaginationWrapper({
  paginationComponent: Pagination,
  actions,
  utils: { hooks, selectors }
}) {
  const pageCount = hooks.useSelector(selectors.getPageCount)
  const pageIndex = hooks.useSelector(selectors.getPageIndex)
  const pageSize = hooks.useSelector(s => s.pageSize)

  const isStateNormal = hooks.useSelector(selectors.getIsStateNormal)

  const goToPage = useCallback(page => {
    if (!_.inRange(--page, pageCount)) return false
    actions.setActive(page * pageSize)
    return true
  }, [actions, pageCount, pageSize])

  if (!isStateNormal) return null
  if (pageCount <= 1) return null

  return <Pagination
    page={pageIndex + 1}
    pageCount={pageCount}
    goToPage={goToPage}
  />
}

export default PaginationWrapper
