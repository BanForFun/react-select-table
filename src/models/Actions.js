import _ from "lodash";

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
    CLEAR_SELECTION: "",
    SELECT_ALL: "",
    SET_ACTIVE: "",

    //Search
    SEARCH: "SEARCH_SET_PHRASE",
    GO_TO_MATCH: "SEARCH_GO_TO_MATCH",

    //Pagination
    SET_PAGE_SIZE: "",

    DEBUG: ""
};

//Set action type strings
Object.freeze(_.each(types, (type, name) =>
    types[name] = `RST_${type || name}`));

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

        baseSortItems: (path, addToPrev) =>
            Action(types.SORT_ITEMS, { path, addToPrev }),

        baseSelect: (index, addToPrev, isRange, contextMenu = false) =>
            Action(types.SELECT, { index, addToPrev, isRange, contextMenu }),

        baseClearSelection: (contextMenu = false) =>
            Action(types.CLEAR_SELECTION, { contextMenu }),

        baseSetActive: (index, contextMenu = false) =>
            Action(types.SET_ACTIVE, { index, contextMenu }),

        selectAll: () =>
            Action(types.SELECT_ALL),

        setSelected: (map, activeIndex = null, pivotIndex = null) =>
            Action(types.SET_SELECTED, { map, activeIndex, pivotIndex }),

        setError: (error) =>
            Action(types.SET_ERROR, { error }),

        startLoading: () =>
            Action(types.START_LOADING)
    }

    const aliases = {
        select: (e, index) =>
            actions.baseSelect(index, e.ctrlKey, e.shiftKey, e.type === "contextmenu"),

        setActive: (e, index) =>
            actions.baseSetActive(index, e.type === "contextmenu")
    }

    return Object.assign(actions, aliases);
}
