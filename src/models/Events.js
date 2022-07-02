export const handlersSymbol = Symbol('Event handlers')

/**
 * @namespace EventsTypes
 */

/**
 * @typedef {Events} EventsTypes.EventsClass
 */

/**
 * @typedef {import('../store/store').StoreTypes.State} State
 */

/**
 * @typedef {import('../store/store').StoreTypes.RowKey} RowKey
 */

/**
 * When {@link Options.multiSelect} is true:
 * A {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set|Set}
 * containing the keys of all selected rows.
 *
 * When Options.multiSelect is false: The key of the selected row, or null if no row is selected.
 *
 * @typedef {?RowKey|Set<RowKey>} EventsTypes.SelectionArg
 */

/**
 * The argument of onContextMenu varies a lot based on the modifier keys pressed and the table options,
 * but the type is either a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set|Set}
 * of {@link StoreTypes.RowKey} when {@link Options.multiSelect} is true,
 * or just {@link StoreTypes.RowKey} when {@link Options.multiSelect} is false.
 * That is all you need to know to implement the handler, but here are the details for the right-click behaviour if
 * you're curious:
 *
 * Terminology:
 *
 * - Empty argument: null when {@link Options.multiSelect} is false,
 * or an empty Set when {@link Options.multiSelect} is true
 * - Active row: The row with a dark green underline (in the builtin theme)
 * - Selected rows: Rows with a green background (in the builtin theme)
 *
 *
 * Non-ListBox table behaviour:
 *
 * - If Alt is held, the argument will be empty even if there are selected rows,
 * which will not be affected no matter where the pointer is.
 *
 * - If Ctrl+Alt is held, the argument will be the existing selection,
 * which will not be affected no matter where the pointer is.
 *
 * - If the pointer is under the rows but Ctrl is held, the argument will be the existing selection,
 * which will not be affected.
 *
 * - In all other cases, a right-click does the same action as a left-click, and onContextMenu is called afterwards,
 * with the updated selection as the argument.
 *
 *
 * ListBox table behaviour:
 *
 * <u>Note</u>: In the cases that the argument is the key of the active row, it is implied that it is contained in a Set,
 * when {@link Options.multiSelect} is true.
 *
 * - If Alt is held, the argument will be empty even if there is an active row,
 * which will not be affected no matter where the pointer is.
 *
 * - If Ctrl+Alt is held, the argument will be the key of the existing active row,
 * which will not be affected no matter where the pointer is.
 *
 * - If Ctrl is held, the argument will be the existing selection,
 * which will not be affected no matter where the pointer is.
 *
 * - If the pointer is under the rows, the argument will be empty even if there is an active row,
 * which will not be affected.
 *
 * - In all other cases, the row under the pointer is set as the active one, and onContextMenu is called afterwards,
 * with the key of the new active row as the argument.
 *
 * @typedef {?RowKey|Set<RowKey>} EventsTypes.ContextMenuArg
 */

export default class Events {
  constructor(selectors) {
    /** @private */
    this.selectors = selectors

    this[handlersSymbol] = {}
  }

  /**
   * Calls the {@link TableProps.onSelectionChange} event handler with {@link EventsTypes.SelectionArg} as the argument
   *
   * @param {State} state The table's state
   * @returns {void}
   */
  selectionChange(state) {
    return this[handlersSymbol].onSelectionChange?.(this.selectors.getSelectionArg(state))
  }

  /**
   * Calls the {@link TableProps.onItemsOpen} event handler with {@link EventsTypes.SelectionArg} as the first argument
   *
   * @param {State} state Passed to {@link Selectors.getSelectionArg}
   * @param {boolean} fromKeyboard Passed through to the handler as the second argument
   * @returns {void}
   */
  itemsOpen(state, fromKeyboard) {
    return this[handlersSymbol].onItemsOpen?.(this.selectors.getSelectionArg(state), fromKeyboard)
  }

  /**
   * Calls the {@link TableProps.onContextMenu} event handler with {@link EventsTypes.ContextMenuArg} as the argument
   *
   * @param {State} state Passed to {@link Selectors.getContextMenuArg}
   * @param {boolean} [forceEmpty] Passed to {@link Selectors.getContextMenuArg}
   * @param {boolean} [forceSelection] Passed to {@link Selectors.getContextMenuArg}
   * @returns {void}
   */
  contextMenu(state, forceEmpty, forceSelection) {
    return this[handlersSymbol].onContextMenu?.(this.selectors.getContextMenuArg(state, forceEmpty, forceSelection))
  }

  /**
   * Calls the {@link TableProps.onKeyDown} event handler with {@link EventsTypes.SelectionArg} as the second argument
   *
   * @param {State} state Passed to {@link Selectors.getSelectionArg}
   * @param {KeyboardEvent<HTMLDivElement>} e Passed through to the handler as the first argument
   * @returns {void}
   */
  keyDown(state, e) {
    return this[handlersSymbol].onKeyDown?.(e, this.selectors.getSelectionArg(state))
  }

  /**
   * Calls the {@link TableProps.onColumnResizeEnd} event handler
   *
   * @param {number[]} widths Passed through to the handler as the first argument
   * @returns {void}
   */
  columnResizeEnd(widths) {
    return this[handlersSymbol].onColumnResizeEnd?.(widths)
  }
}
