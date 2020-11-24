import { pagePositions } from "../constants/enums";

export default class TableActions {
    constructor(namespace) {
        this.namespace = namespace;
    }

    //Rows
    static SET_ROWS = "TABLE_SET_ROWS";
    static ADD_ROWS = "TABLE_ADD_ROWS";
    static DELETE_ROWS = "TABLE_DELETE_ROWS";
    static SET_ROW_VALUES = "TABLE_SET_ROW_VALUES";
    static PATCH_ROWS = "TABLE_PATCH_ROWS";
    static CLEAR_ROWS = "TABLE_CLEAR_ROWS";
    static SORT_BY = "TABLE_SORT_BY";
    static SET_FILTER = "TABLE_SET_FILTER";

    //Displaying
    static SET_ERROR = "TABLE_SET_ERROR";
    static START_LOADING = "TABLE_START_LOADING";

    //Selection
    static SET_ROWS_SELECTED = "TABLE_SET_ROWS_SELECTED";
    static SELECT_ROW = "TABLE_SELECT_ROW";
    static CLEAR_SELECTION = "TABLE_CLEAR_SELECTION";
    static SELECT_ALL = "TABLE_SELECT_ALL";
    static SET_ACTIVE_ROW = "TABLE_SET_ACTIVE_ROW";
    static SET_PIVOT_ROW = "TABLE_SET_PIVOT_ROW";
    static CONTEXT_MENU = "TABLE_CONTEXT_MENU";

    //Pagination
    static GO_TO_PAGE = "TABLE_GO_TO_PAGE";
    static SET_PAGE_SIZE = "TABLE_SET_PAGE_SIZE";

    _getAction(type, payload = null) {
        return { type, namespace: this.namespace, payload };
    }

    goToPage = index =>
        this._getAction(self.GO_TO_PAGE, { index });

    setPageSize = size =>
        this._getAction(self.SET_PAGE_SIZE, { size });

    clearRows = () =>
        this._getAction(self.CLEAR_ROWS);

    contextMenu = (value, ctrlKey) =>
        this._getAction(self.CONTEXT_MENU, { value, ctrlKey });

    setFilter = filter =>
        this._getAction(self.SET_FILTER, { filter });

    patchRows = (...patches) =>
        this._getAction(self.PATCH_ROWS, { patches });

    setRowValues = map =>
        this._getAction(self.SET_ROW_VALUES, { map });

    deleteRows = (...values) =>
        this._getAction(self.DELETE_ROWS, { values });

    addRows = (...items) =>
        this._getAction(self.ADD_ROWS, { items });

    setRows = items =>
        this._getAction(self.SET_ROWS, { items });

    sortBy = (path, shiftKey = false) =>
        this._getAction(self.SORT_BY, { path, shiftKey });

    selectRow = (value, ctrlKey = false, shiftKey = false) =>
        this._getAction(self.SELECT_ROW, { value, ctrlKey, shiftKey });

    setActiveRow = value =>
        this._getAction(self.SET_ACTIVE_ROW, { value });

    setPivotRow = value =>
        this._getAction(self.SET_PIVOT_ROW, { value });

    clearSelection = () =>
        this._getAction(self.CLEAR_SELECTION);

    selectAll = () =>
        this._getAction(self.SELECT_ALL);

    setRowsSelected = map =>
        this._getAction(self.SET_ROWS_SELECTED, { map });

    setError = error =>
        this._getAction(self.SET_ERROR, { error });

    startLoading = () =>
        this._getAction(self.START_LOADING);

    //Aliases

    firstPage = () => this.goToPage(1);
    lastPage = () => this.goToPage(pagePositions.Last);
    previousPage = () => this.goToPage(pagePositions.Previous);
    nextPage = () => this.goToPage(pagePositions.Next);

    //Backwards compatibility
    setRowValue = (oldValue, newValue) => this.setRowValues({[oldValue]: newValue});
    setRowSelected = (value, selected) => this.setRowsSelected({[value]: selected});
    addRow = item => this.addRows(item);
    patchRow = patch => this.patchRows(patch);
}

const self = TableActions;
