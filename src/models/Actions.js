export const relativePos = Object.freeze({
    Next: "next",
    Prev: "prev",
    First: "first",
    Last: "last"
});

export const specialValues = Object.freeze({
    FirstItem: "firstItem",
    LastItem: "lastItem",
    FirstRow: "firstRow",
    LastRow: "lastRow",
    ActiveRow: "activeRow"
});

export const types = {
    //Items
    SET_ITEMS: "",
    ADD_ITEMS: "",
    DELETE_ITEMS: "",
    PATCH_ITEM_VALUES: "",
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

    //Search
    SEARCH: "",
    GO_TO_MATCH: "",

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
    function Action(type, payload = {}) {
        return { type, namespace, payload };
    }

    const actions = {
        debug: () => Action(types.DEBUG),

        search: (phrase) =>
            Action(types.SEARCH, { phrase }),

        goToMatch: (index) =>
            Action(types.GO_TO_MATCH, { index }),

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

        patchItemValues: (map) =>
            Action(types.PATCH_ITEM_VALUES, { map }),

        deleteItems: (...values) =>
            Action(types.DELETE_ITEMS, { values }),

        addItems: (...items) =>
            Action(types.ADD_ITEMS, { items }),

        setItems: (items) =>
            Action(types.SET_ITEMS, { items }),

        baseSortItems: (path, shiftKey) =>
            Action(types.SORT_ITEMS, { path, shiftKey }),

        baseSelectRelative: (offset, ctrlKey, shiftKey, origin = specialValues.ActiveRow) =>
            Action(types.SELECT_RELATIVE, { offset, origin, ctrlKey, shiftKey }),

        baseSelect: (index, ctrlKey, shiftKey, contextMenu = false) =>
            Action(types.SELECT, { index, ctrlKey, shiftKey, contextMenu }),

        baseClearSelection: (ctrlKey, contextMenu = false) =>
            Action(types.CLEAR_SELECTION, { ctrlKey, contextMenu }),

        selectAll: () =>
            Action(types.SELECT_ALL),

        setSelected: (map, activeIndex = null, pivotValue = null) =>
            Action(types.SET_SELECTED, { map, activeIndex, pivotValue }),

        setError: (error) =>
            Action(types.SET_ERROR, { error }),

        startLoading: () =>
            Action(types.START_LOADING)
    }

    const aliases = {
        selectRelative: (e, offset, origin = undefined) =>
            actions.baseSelectRelative(offset, e.ctrlKey, e.shiftKey, origin),

        select: (e, index) =>
            actions.baseSelect(index, e.ctrlKey, e.shiftKey, e.type === "contextmenu"),

        clearSelection: (e) =>
            actions.baseClearSelection(e.ctrlKey,e.type === "contextmenu"),

        sortItems: (e, path) =>
            actions.baseSortItems(path, e.shiftKey)
    }

    return Object.assign(actions, aliases);
}
