import * as selectors from '../selectors/selectors'
import * as setUtils from '../utils/setUtils'

export const handlersSymbol = Symbol('Event handlers')

export default function Events(utils) {
  const { options } = utils

  const getSelectionArg = (state) => {
    const selectedKeys = setUtils.getItems(state.selected)
    if (options.multiSelect)
      return new Set(selectedKeys)

    return selectedKeys[0] ?? null
  }

  const getListBoxSelectionArg = (state) => {
    const activeKey = selectors.getActiveKey(state)
    if (!options.multiSelect) return activeKey

    const selection = new Set()
    if (activeKey != null) selection.add(activeKey)
    return selection
  }

  const getContextMenuArg = (state, forceEmpty) => {
    if (forceEmpty)
      return options.multiSelect ? new Set() : null

    return options.listBox ? getListBoxSelectionArg(state) : getSelectionArg(state)
  }

  const handlers = {}
  this[handlersSymbol] = handlers

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
