import { reduxEventHandlersPropTypes } from '../types/TableProps'
import _ from 'lodash'

export const handlersSymbol = Symbol('Event handlers')

/**
 * @namespace EventsTypes
 */

/**
 * @typedef {Events} EventsTypes.EventsClass
 */

/**
 * @typedef {import('../store/store').StoreTypes.State} StateType
 */

/**
 * @typedef {import('../store/store').StoreTypes.RowKey} RowKeyType
 */

/**
 * When {@link Options.multiSelect} is true:
 * A {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set|Set}
 * containing the keys of all selected rows.
 *
 * When Options.multiSelect is false: The key of the selected row, or null if no row is selected.
 *
 * @typedef {?RowKeyType|Set<RowKeyType>} EventsTypes.SelectionArg
 */

/**
 * The argument of onContextMenu varies a lot based on the modifier keys pressed and the table options,
 * but the type is either a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set|Set}
 * of {@link StoreTypes.RowKey} when {@link Options.multiSelect} is true,
 * or just {@link StoreTypes.RowKey} when {@link Options.multiSelect} is false.
 * You can find details for the value of the argument in the readme.
 *
 * @typedef {?RowKeyType|Set<RowKeyType>} EventsTypes.ContextMenuArg
 */

export const noopEventHandler = () => {}
export const getNoopHandlers = () =>
  _.mapValues(reduxEventHandlersPropTypes, _.constant(noopEventHandler))

export default class Events {
  constructor(selectors) {
    /** @private */
    this.selectors = selectors

    this[handlersSymbol] = getNoopHandlers()
  }

  /**
   * Returns whether there is a handler for the given event
   *
   * @param {string} event The name of the event
   * @returns {boolean} True, if the handler exists
   */
  hasListener(event) {
    return this[handlersSymbol][event] !== noopEventHandler
  }

  /**
   * Calls the {@link TableProps.onSelectionChange} event handler with {@link EventsTypes.SelectionArg} as the argument
   *
   * @param {StateType} state The table's state
   */
  selectionChange(state) {
    this[handlersSymbol].onSelectionChange(this.selectors.getSelectionArg(state))
  }

  /**
   * Calls the {@link TableProps.onContextMenu} event handler with {@link EventsTypes.ContextMenuArg} as the argument
   *
   * @param {StateType} state Passed to {@link Selectors.getContextMenuArg}
   * @param {boolean} [forceEmpty] Passed to {@link Selectors.getContextMenuArg}
   * @param {boolean} [forceSelection] Passed to {@link Selectors.getContextMenuArg}
   */
  contextMenu(state, forceEmpty, forceSelection) {
    this[handlersSymbol].onContextMenu(this.selectors.getContextMenuArg(state, forceEmpty, forceSelection))
  }

  /**
   * Calls the {@link TableProps.onActionDispatched} event handler
   *
   * @param {boolean} internal Passed through to the handler as the first argument
   */
  actionDispatched(internal = false) {
    this[handlersSymbol].onActionDispatched(internal)
  }
}
