import React, { useCallback } from 'react'
import AngleIcon, { angleRotation } from './AngleIcon'
import { dataAttributeFlags } from '../utils/dataAttributeUtils'

/**
 * Child of {@link Components.Root}.
 *
 * @name Components.SearchContainer
 * @type {React.FC}
 */
function SearchContainer(props) {
  const {
    utils: { hooks },
    inputRef,
    actions
  } = props

  const phrase = hooks.useSelector(s => s.searchPhrase)
  const matchCount = hooks.useSelector(s => s.searchMatches.length)
  const matchIndex = hooks.useSelector(s => s.searchMatchIndex)

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

  return <div
    className='rst-searchContainer'
    {...dataAttributeFlags({ visible: isVisible })}
  >
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
