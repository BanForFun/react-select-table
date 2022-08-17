import types from '../constants/actionTypes'
import { getTableUtils } from '../utils/tableUtils'
import * as setUtils from '../utils/setUtils'

const tableActionTypes = new Set(Object.values(types))

/**
 * @type {import('redux').Middleware<>}
 */
const eventMiddleware = (store) => (next) => (action) => {
  const { type, namespace, internal, contextMenu } = action

  // If action is not for table, do nothing
  if (!tableActionTypes.has(type)) return next(action)

  // Get table events and selectors
  const { events, selectors } = getTableUtils(namespace)
  events.actionDispatched(internal)

  // Get previous and current state
  const getState = () => selectors.getTableState(store.getState())

  const prevState = getState()
  const result = next(action)
  const newState = getState()

  // Raise onSelectionChange
  if (!setUtils.isEqual(prevState.selected, newState.selected))
    events.selectionChange(newState)

  // Raise onContextMenu
  if (contextMenu)
    events.contextMenu(newState)

  return result
}

export default eventMiddleware
