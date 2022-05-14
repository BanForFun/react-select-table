import * as selectors from '../selectors'

export default function Events(options, handlers) {
  const getSelectionArg = (state) =>
    options.multiSelect
      ? new Set(state.selection) // Make a copy so the handler can't modify the state
      : state.selection.values().next().value ?? null

  const parseSelectedValue = (value) => {
    if (!options.multiSelect) return value

    const selection = new Set()
    if (value != null) selection.add(value)
    return selection
  }

  const getContextMenuArg = (state, forceEmpty) => {
    if (forceEmpty) return parseSelectedValue(null)
    return options.listBox
      ? parseSelectedValue(selectors.getActiveValue(state))
      : getSelectionArg(state)
  }

  this.selectionChanged = (state) =>
    handlers.onSelectionChange?.(getSelectionArg(state))

  this.itemsOpen = (state, fromKeyboard) =>
    handlers.onItemsOpen?.(getSelectionArg(state), fromKeyboard)

  this.contextMenu = (state, forceEmpty = false) =>
    handlers.onContextMenu?.(getContextMenuArg(state, forceEmpty))

  this.keyDown = (state, e) =>
    handlers.onKeyDown?.(e, getSelectionArg(state))

  this.columnResizeEnd = (state, widths) =>
    handlers.onColumnResizeEnd?.(widths)
}
