export default class TableActions {
    constructor(namespace) {
        this.namespace = namespace;
    }

    _getAction(type, payload = null) {
        return { type, namespace: this.namespace, payload };
    }

    //Items
    static SET_ITEMS = "RST_SET_ITEMS";
    static ADD_ITEMS = "RST_ADD_ITEMS";
    static DELETE_ITEMS = "RST_DELETE_ITEMS";
    static SET_ITEM_VALUES = "RST_SET_ITEM_VALUES";
    static PATCH_ITEMS = "RST_PATCH_ITEMS";
    static CLEAR_ITEMS = "RST_CLEAR_ITEMS";
    static SORT_ITEMS = "RST_SORT_ITEMS";
    static SET_ITEM_FILTER = "RST_SET_ITEM_FILTER";

    //Displaying
    static SET_ERROR = "RST_SET_ERROR";
    static START_LOADING = "RST_START_LOADING";

    //Selection
    static SET_SELECTED = "RST_SET_SELECTED";
    static SELECT = "RST_SELECT";
    static CLEAR_SELECTION = "RST_CLEAR_SELECTION";
    static SELECT_ALL = "RST_SELECT_ALL";
    static SET_ACTIVE = "RST_SET_ACTIVE";
    static SET_PIVOT = "RST_SET_PIVOT";
    static CONTEXT_MENU = "RST_CONTEXT_MENU";

    //Pagination
    static GO_TO_PAGE = "RST_GO_TO_PAGE";
    static SET_PAGE_SIZE = "RST_SET_PAGE_SIZE";

    goToPage = page =>
        this._getAction(self.GO_TO_PAGE, { page });

    setPageSize = size =>
        this._getAction(self.SET_PAGE_SIZE, { size });

    clearItems = () =>
        this._getAction(self.CLEAR_ITEMS);

    contextMenu = (index, ctrlKey) =>
        this._getAction(self.CONTEXT_MENU, { index, ctrlKey });

    setItemFilter = filter =>
        this._getAction(self.SET_ITEM_FILTER, { filter });

    patchItems = (...patches) =>
        this._getAction(self.PATCH_ITEMS, { patches });

    setItemValues = map =>
        this._getAction(self.SET_ITEM_VALUES, { map });

    deleteItems = (...values) =>
        this._getAction(self.DELETE_ITEMS, { values });

    addItems = (...items) =>
        this._getAction(self.ADD_ITEMS, { items });

    setItems = items =>
        this._getAction(self.SET_ITEMS, { items });

    sortItems = (path, shiftKey = false) =>
        this._getAction(self.SORT_ITEMS, { path, shiftKey });

    select = (index, ctrlKey = false, shiftKey = false) =>
        this._getAction(self.SELECT, { index, ctrlKey, shiftKey });

    setActive = index =>
        this._getAction(self.SET_ACTIVE, { index });

    clearSelection = () =>
        this._getAction(self.CLEAR_SELECTION);

    selectAll = () =>
        this._getAction(self.SELECT_ALL);

    setSelected = (map, active = null, pivot = null) =>
        this._getAction(self.SET_SELECTED, { map, active, pivot });

    setError = error =>
        this._getAction(self.SET_ERROR, { error });

    startLoading = () =>
        this._getAction(self.START_LOADING);
}

const self = TableActions;
