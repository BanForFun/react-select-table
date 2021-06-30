export const types = {
    //Items
    SET_ITEMS: "",
    ADD_ITEMS: "",
    DELETE_ITEMS: "",
    SET_ITEM_VALUES: "",
    PATCH_ITEMS: "",
    CLEAR_ITEMS: "",
    SORT_ITEMS: "",
    SET_ITEM_FILTER: "",

    //Displaying
    SET_ERROR: "",
    START_LOADING: "",

    //Selection
    SET_SELECTED: "",
    SELECT: "",
    SELECT_RELATIVE: "",
    CLEAR_SELECTION: "",
    SELECT_ALL: "",
    CONTEXT_MENU: "",
    SEARCH: "",

    //Pagination
    SET_PAGE_SIZE: "",
    GO_TO_PAGE_RELATIVE: "",

    DEBUG: ""
};

//Set action type strings
for (let name in types)
    types[name] = `RST_${name}`;

Object.freeze(types);

export default function Actions(namespace) {
    function Action(type, payload = null) {
        return { type, namespace, payload }
    }

    const actions = {
        debug: () => Action(types.DEBUG),

        search: (letter) =>
            Action(types.SEARCH, { letter }),

        goToPageRelative: (position) =>
            Action(types.GO_TO_PAGE_RELATIVE, { position }),

        setPageSize: (size) =>
            Action(types.SET_PAGE_SIZE, { size }),

        clearItems: () =>
            Action(types.CLEAR_ITEMS),

        setItemFilter: (filter) =>
            Action(types.SET_ITEM_FILTER, { filter }),

        patchItems: (...patches) =>
            Action(types.PATCH_ITEMS, { patches }),

        setItemValues: (map) =>
            Action(types.SET_ITEM_VALUES, { map }),

        deleteItems: (...values) =>
            Action(types.DELETE_ITEMS, { values }),

        addItems: (...items) =>
            Action(types.ADD_ITEMS, { items }),

        setItems: (items) =>
            Action(types.SET_ITEMS, { items }),

        baseSortItems: (path, shiftKey) =>
            Action(types.SORT_ITEMS, { path, shiftKey }),

        baseSelectRelative: (offset, ctrlKey, shiftKey, origin = null) =>
            Action(types.SELECT_RELATIVE, { offset, origin, ctrlKey, shiftKey }),

        baseSelect: (value, ctrlKey, shiftKey) =>
            Action(types.SELECT, { value, ctrlKey, shiftKey }),

        baseContextMenu: (index, ctrlKey) =>
            Action(types.CONTEXT_MENU, { index, ctrlKey }),

        clearSelection: () =>
            Action(types.CLEAR_SELECTION),

        selectAll: () =>
            Action(types.SELECT_ALL),

        setSelected: (map, active = null, pivot = null) =>
            Action(types.SET_SELECTED, { map, active, pivot }),

        setError: (error) =>
            Action(types.SET_ERROR, { error }),

        startLoading: () =>
            Action(types.START_LOADING)
    }

    const aliases = {
        selectRelative: (offset, e, origin = null) =>
            actions.baseSelectRelative(offset, e.ctrlKey, e.shiftKey, origin),

        select: (value, e) =>
            actions.baseSelect(value, e.ctrlKey, e.shiftKey),

        contextMenu: (index, e) =>
            actions.baseContextMenu(index, e.ctrlKey),

        sortItems: (path, e) =>
            actions.baseSortItems(path, e.shiftKey)
    }

    return Object.assign(actions, aliases);
}
