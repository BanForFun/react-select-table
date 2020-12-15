export default class TableActions {
    constructor(namespace) {
        this.namespace = namespace;
    }

    _getAction(type, payload = null) {
        return { type, namespace: this.namespace, payload };
    }

    //Items
    static SET_ITEMS = "TABLE_SET_ITEMS";
    static ADD_ITEMS = "TABLE_ADD_ITEMS";
    static DELETE_ITEMS = "TABLE_DELETE_ITEMS";
    static SET_ITEM_VALUES = "TABLE_SET_ITEM_VALUES";
    static PATCH_ITEMS = "TABLE_PATCH_ITEMS";
    static CLEAR_ITEMS = "TABLE_CLEAR_ITEMS";
    static SORT_ITEMS = "TABLE_SORT_ITEMS";
    static SET_ITEM_FILTER = "TABLE_SET_ITEM_FILTER";

    //Displaying
    static SET_ERROR = "TABLE_SET_ERROR";
    static START_LOADING = "TABLE_START_LOADING";

    //Selection
    static SET_SELECTED = "TABLE_SET_SELECTED";
    static SELECT = "TABLE_SELECT";
    static CLEAR_SELECTION = "TABLE_CLEAR_SELECTION";
    static SELECT_ALL = "TABLE_SELECT_ALL";
    static SET_ACTIVE = "TABLE_SET_ACTIVE";
    static SET_PIVOT = "TABLE_SET_PIVOT";
    static CONTEXT_MENU = "TABLE_CONTEXT_MENU";

    //Pagination
    static GO_TO_PAGE = "TABLE_GO_TO_PAGE";
    static SET_PAGE_SIZE = "TABLE_SET_PAGE_SIZE";

    goToPage = index =>
        this._getAction(self.GO_TO_PAGE, { index });

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

    setPivot = index =>
        this._getAction(self.SET_PIVOT, { index });

    clearSelection = () =>
        this._getAction(self.CLEAR_SELECTION);

    selectAll = () =>
        this._getAction(self.SELECT_ALL);

    setSelected = map =>
        this._getAction(self.SET_SELECTED, { map });

    setError = error =>
        this._getAction(self.SET_ERROR, { error });

    startLoading = () =>
        this._getAction(self.START_LOADING);
}

const self = TableActions;
