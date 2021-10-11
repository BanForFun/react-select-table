export default function EventRaisers(handlers, options, selectors) {
    const getSelectionArg = state =>
        options.multiSelect
        ? state.selection
        : state.selection.values().next().value ?? null;

    const getContextMenuArg = state =>
        options.listBox
        ? selectors.getActiveValue(state)
        : getSelectionArg(state);

    return {
        selectionChanged: state =>
            handlers.onSelectionChange(getSelectionArg(state)),

        itemsOpen: (state, fromKeyboard) =>
            handlers.onItemsOpen(getSelectionArg(state), fromKeyboard),

        contextMenu: state =>
            handlers.onContextMenu(getContextMenuArg(state)),

        keyDown: (state, e) =>
            handlers.onKeyDown(e, getSelectionArg(state)),

        columnsResizeEnd: (state, widths) =>
            handlers.onColumnsResizeEnd(widths)
    };
}
