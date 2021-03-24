export const types = Object.freeze({
    //Items
    SET_ITEMS: "RST_SET_ITEMS",
    ADD_ITEMS: "RST_ADD_ITEMS",
    DELETE_ITEMS: "RST_DELETE_ITEMS",
    SET_ITEM_VALUES: "RST_SET_ITEM_VALUES",
    PATCH_ITEMS: "RST_PATCH_ITEMS",
    CLEAR_ITEMS: "RST_CLEAR_ITEMS",
    SORT_ITEMS: "RST_SORT_ITEMS",
    SET_ITEM_FILTER: "RST_SET_ITEM_FILTER",

    //Displaying
    SET_ERROR: "RST_SET_ERROR",
    START_LOADING: "RST_START_LOADING",

    //Selection
    SET_SELECTED: "RST_SET_SELECTED",
    SELECT: "RST_SELECT",
    CLEAR_SELECTION: "RST_CLEAR_SELECTION",
    SELECT_ALL: "RST_SELECT_ALL",
    SET_ACTIVE: "RST_SET_ACTIVE",
    SET_PIVOT: "RST_SET_PIVOT",
    CONTEXT_MENU: "RST_CONTEXT_MENU",
    SEARCH: "RST_SEARCH",

    //Pagination
    GO_TO_PAGE: "RST_GO_TO_PAGE",
    SET_PAGE_SIZE: "RST_SET_PAGE_SIZE"
})

export default function Actions(namespace) {
    function Action(type, payload = null) {
        return { type, namespace, payload }
    }

    return {
        search: (letter) =>
            Action(types.SEARCH, { letter }),

        goToPage: (index) =>
            Action(types.GO_TO_PAGE, { index }),

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

        sortItems: (path, shiftKey = false) =>
            Action(types.SORT_ITEMS, { path, shiftKey }),

        select: (index, fromKeyboard, ctrlKey = false, shiftKey = false) =>
            Action(types.SELECT, { index, fromKeyboard, ctrlKey, shiftKey }),

        contextMenu: (index, ctrlKey = false) =>
            Action(types.CONTEXT_MENU, { index, ctrlKey }),

        setActive: (index) =>
            Action(types.SET_ACTIVE, { index }),

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
}
