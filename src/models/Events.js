import * as selectors from '../selectors/selectors'
import _ from 'lodash'

export const handlersSymbol = Symbol('Event handlers')

export default function Events(utils) {
  const { options } = utils

  const getSelectionArg = (state) => {
    if (options.multiSelect)
      return new Set(Object.keys(state.selected))

    return _.findKey(state.selected) ?? null
  }

  const getListBoxSelectionArg = (state) => {
    const activeValue = selectors.getActiveValue(state)
    if (!options.multiSelect) return activeValue

    const selection = new Set()
    if (activeValue != null) selection.add(activeValue)
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
