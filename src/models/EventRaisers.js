const noopEventHandler = () => {};

export const defaultEventHandlers = {
    onContextMenu: noopEventHandler,
    onSelectionChange: noopEventHandler,
    onItemsOpen: noopEventHandler,
    onColumnResizeEnd: noopEventHandler,
    onKeyDown: noopEventHandler,
};

export default function EventRaisers(handlers, options, selectors) {
    const getSelectionArg = (state) =>
        options.multiSelect
            ? new Set(state.selection) // Make a copy so the handler can't modify the state
            : state.selection.values().next().value ?? null;

    const getContextMenuArg = (state, forceEmpty) => {
        if (forceEmpty) return parseSelectedValue(null);
        return options.listBox
            ? parseSelectedValue(selectors.getActiveValue(state))
            : getSelectionArg(state);
    };

    const parseSelectedValue = (value) => {
        if (!options.multiSelect) return value;

        const selection = new Set();
        if (value != null) selection.add(value);
        return selection;
    };

    return {
        isHandlerDefined: (name) =>
            handlers[name] !== noopEventHandler,

        selectionChanged: (state) =>
            handlers.onSelectionChange(getSelectionArg(state)),

        itemsOpen: (state, fromKeyboard) =>
            handlers.onItemsOpen(getSelectionArg(state), fromKeyboard),

        contextMenu: (state, forceEmpty = false) =>
            handlers.onContextMenu(getContextMenuArg(state, forceEmpty)),

        keyDown: (state, e) =>
            handlers.onKeyDown(e, getSelectionArg(state)),

        columnResizeEnd: (state, widths) =>
            handlers.onColumnResizeEnd(widths),
    };
}
