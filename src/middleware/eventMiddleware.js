import types from '../constants/actionTypes'
import { getTableUtils } from '../utils/tableUtils'
import * as setUtils from '../utils/setUtils'

const tableActionTypes = new Set(Object.values(types))

/**
 * @type {import('redux').Middleware<>}
 */
const eventMiddleware = (store) => (next) => (action) => {
  const { type, namespace, payload, internal } = action

  // If action is not for table, do nothing
  if (!tableActionTypes.has(type)) return next(action)

  // Get table events and selectors
  const { events, selectors } = getTableUtils(namespace)
  events.actionDispatched(internal)

  switch (type) {
    case types.SET_ITEMS: // Selection
    case types.ADD_ITEMS: // Selection
    case types.DELETE_ITEMS: // Selection
    case types.PATCH_ITEMS: // Selection (if row is hidden after patch)
    case types.PATCH_ITEMS_BY_KEY: // Selection (if row is hidden after patch)
    case types.CLEAR_ITEMS: // Selection
    case types.SET_ITEM_FILTER: // Selection
    case types.SELECT: // Selection, Context menu
    case types.SET_ACTIVE: // Context menu
    case types.CLEAR_SELECTION: // Context menu
    case types.SET_SELECTED: // Selection
    case types.SELECT_ALL: // Selection
    {
      const getState = () => selectors.getTableState(store.getState())

      // Get previous and current state
      const prevState = getState()
      const result = next(action)
      const newState = getState()

      // Raise onSelectionChange
      if (!setUtils.isEqual(prevState.selected, newState.selected))
        events.selectionChange(newState)

      // Raise onContextMenu
      if (payload?.contextMenu) // Payload is undefined for selectAll
        events.contextMenu(newState)

      return result
    }
    default:
      return next(action)
  }
}

export default eventMiddleware
