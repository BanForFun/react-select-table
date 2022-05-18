import React, { useCallback } from 'react'
import classNames from 'classnames'
import AngleIcon, { angleRotation } from './AngleIcon'

function SearchContainer(props) {
  const {
    utils: { hooks },
    inputRef,
    actions
  } = props

  const phrase = hooks.useSelector(s => s.searchPhrase)
  const matchCount = hooks.useSelector(s => s.matches.length)
  const matchIndex = hooks.useSelector(s => s.matchIndex)

  const isVisible = phrase !== null

  const goToAdjacentMatch = useCallback((offset) =>
    actions.goToMatch(matchIndex + offset),
  [actions, matchIndex])

  const handleChange = useCallback(e => {
    actions.search(e.currentTarget.value)
  }, [actions])

  const handleKeyDown = useCallback(e => {
    if (!isVisible) return
    e.stopPropagation()

    switch (e.keyCode) {
      case 38: // Up
        goToAdjacentMatch(-1)
        break
      case 40: // Down
        goToAdjacentMatch(1)
        break
      case 27: // Escape
        actions.search(null)
        break
      default:
        return
    }

    e.preventDefault()
  }, [actions, goToAdjacentMatch, isVisible])

  const className = classNames({
    'rst-searchContainer': true,
    'rst-visible': isVisible
  })

  return <div className={className}>
    <div className='rst-search'>
      <input
        value={phrase || ''}
        ref={inputRef}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <div className='rst-matches'>
        {matchCount && (matchIndex + 1)}/{matchCount}
      </div>

      <div className='rst-separator' />

      <button tabIndex={-1} onClick={() => goToAdjacentMatch(-1)}>
        <AngleIcon rotation={angleRotation.Up} />
      </button>

      <button tabIndex={-1} onClick={() => goToAdjacentMatch(1)}>
        <AngleIcon rotation={angleRotation.Down} />
      </button>
    </div>
  </div>
}

export default SearchContainer
