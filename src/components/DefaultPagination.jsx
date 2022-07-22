import React, { useCallback } from 'react'
import AngleIcon, { angleRotation } from './AngleIcon'
import _ from 'lodash'
import classNames from 'classnames'

const startDelay = 600
const repeatDelay = 100

function PageSpacer({ children }) {
  return <div className='rst-page'>{children}</div>
}

/**
 * Child of {@link Components.PaginationWrapper}.
 *
 * @name Components.DefaultPagination
 * @type {React.FC}
 */
function DefaultPagination({ page, pageCount, goToPage }) {
  const repeatOffsetPage = useCallback(offset => {
    let nextPage = page
    let timeoutId
    const repeatAction = (delay = repeatDelay) => {
      if (!goToPage(nextPage += offset)) return
      timeoutId = setTimeout(repeatAction, delay)
    }

    return e => {
      repeatAction(startDelay)
      e.currentTarget.setPointerCapture(e.pointerId)
      e.currentTarget.addEventListener('pointerup', e => {
        e.currentTarget.releasePointerCapture(e.pointerId)
        clearTimeout(timeoutId)
      }, { once: true })
    }
  }, [page, goToPage])

  function Page({ number, ...rest }) {
    const buttonClass = classNames({
      'rst-page': true,
      'rst-current': number === page
    })

    return <button
      {...rest}
      tabIndex='-1'
      className={buttonClass}
      onClick={() => goToPage(number)}
    >{number}
    </button>
  }

  const prevButton = <button
    key='button_prev'
    tabIndex='-1'
    className='rst-page'
    onPointerDown={repeatOffsetPage(-1)}
  >
    <AngleIcon rotation={angleRotation.Left} />
  </button>

  const nextButton = <button
    key='button_next'
    tabIndex='-1'
    className='rst-page'
    onPointerDown={repeatOffsetPage(1)}
  >
    <AngleIcon rotation={angleRotation.Right} />
  </button>

  const pages = []

  const width = 4
  const pageFromStart = Math.min(page, width)
  const pageFromEnd = Math.min(pageCount - page + 1, width)

  if (pageFromStart >= 3)
    pages.push(<Page key='page_first' number={1} />)

  if (pageFromStart >= 4)
    pages.push(<PageSpacer key='ellipsis_left'>...</PageSpacer>)

  if (pageFromStart >= 2)
    pages.push(prevButton)

  pages.push(<Page key='page_current' number={page} />)

  if (pageFromEnd >= 2)
    pages.push(nextButton)

  if (pageFromEnd >= 4)
    pages.push(<PageSpacer key='ellipsis_right'>...</PageSpacer>)

  if (pageFromEnd >= 3)
    pages.push(<Page key='page_last' number={pageCount} />)

  return <div className='rst-pagination'>
    {_.times(width - pageFromStart, i => <PageSpacer key={`padding_left_${i}`} />)}
    {pages}
    {_.times(width - pageFromEnd, i => <PageSpacer key={`padding_right_${i}`} />)}
  </div>
}

export default DefaultPagination
