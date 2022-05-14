import { types } from '../models/Actions'
import { tableUtils } from '../utils/tableUtils'

function compareSets(a, b) {
  // Compare references
  if (a === b) return true

  // Compare length
  if (a.size !== b.size) return false

  // Compare items
  for (const entry of a)
    if (!b.has(entry)) return false

  return true
}

const eventMiddleware = (store) => (next) => (action) => {
  const { type, namespace, payload } = action

  switch (type) {
    case types.SET_ITEMS:
    case types.ADD_ITEMS:
    case types.DELETE_ITEMS:
    case types.PATCH_ITEMS:
    case types.PATCH_ITEM_VALUES:
    case types.CLEAR_ITEMS:
    case types.SET_ITEM_FILTER:
    case types.SELECT:
    case types.SET_ACTIVE:
    case types.CLEAR_SELECTION:
    case types.SET_SELECTED:
    case types.SELECT_ALL:
    case types.SET_ERROR:
    case types.START_LOADING: {
      // Get table events and selectors
      const { events, getTableState } = tableUtils[namespace].public
      const getState = () => getTableState(store.getState())

      // Get previous and current state
      const prevState = getState()
      const result = next(action)
      const newState = getState()

      // Raise onSelectionChange
      if (!compareSets(prevState.selection, newState.selection))
        events.selectionChanged(newState)

      // Raise onContextMenu
      if (payload.contextMenu)
        events.contextMenu(newState)

      return result
    }
    default:
      return next(action)
  }
}

export default eventMiddleware
