import _ from 'lodash'
import React, { useCallback } from 'react'
import * as selectors from '../selectors/selectors'

// Child of Root
function PaginationWrapper({
  paginationComponent: Pagination,
  actions,
  utils: { hooks }
}) {
  const pageCount = hooks.useSelector(selectors.getPageCount)
  const pageIndex = hooks.useSelector(selectors.getPageIndex)
  const pageSize = hooks.useSelector(s => s.pageSize)

  const goToPage = useCallback(page => {
    if (!_.inRange(--page, pageCount)) return false
    actions.setActive(page * pageSize)
    return true
  }, [actions, pageCount, pageSize])

  return <Pagination
    page={pageIndex + 1}
    pageCount={pageCount}
    goToPage={goToPage}
  />
}

export default PaginationWrapper
