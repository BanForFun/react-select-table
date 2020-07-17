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
    static SET_ERROR = "TABLE_SET_ERROR";

    //Columns
    static SET_COLUMN_WIDTH = "TABLE_SET_COLUMN_WIDTH";
    static SET_COLUMN_ORDER = "TABLE_SET_COLUMN_ORDER";

    //Selection
    static SET_ROW_SELECTED = "TABLE_SET_ROW_SELECTED";
    static SELECT_ROW = "TABLE_SELECT_ROW";
    static CLEAR_SELECTION = "TABLE_CLEAR_SELECTION";
    static SELECT_ALL = "TABLE_SELECT_ALL";
    static SET_ACTIVE_ROW = "TABLE_SET_ACTIVE_ROW";
    static CONTEXT_MENU = "TABLE_CONTEXT_MENU";

    //Pagination
    static GO_TO_PAGE = "TABLE_GO_TO_PAGE";
    static SET_PAGE_SIZE = "TABLE_SET_PAGE_SIZE";

    _getAction(type, payload = null) {
        return { type, namespace: this.namespace, payload };
    }

    goToPage = index =>
        this._getAction(self.GO_TO_PAGE, index);

    setPageSize = size =>
        this._getAction(self.SET_PAGE_SIZE, size);

    clearRows = () =>
        this._getAction(self.CLEAR_ROWS);

    contextMenu = (value, ctrlKey) =>
        this._getAction(self.CONTEXT_MENU, { value, ctrlKey });

    setFilter = filter =>
        this._getAction(self.SET_FILTER, filter);

    patchRows = (...patches) =>
        this._getAction(self.PATCH_ROWS, patches);

    //maps is an param array of arrays with two items: the old and the new value
    //Use array instead of object to allow for oldValue types other than string
    setRowValues = (...maps) =>
        this._getAction(self.SET_ROW_VALUES, maps);

    deleteRows = (...values) =>
        this._getAction(self.DELETE_ROWS, values);

    addRows = (...items) =>
        this._getAction(self.ADD_ROWS,  items);

    setRows = (items, keyed = false) =>
        this._getAction(self.SET_ROWS, { items, keyed });

    setColumnWidth = (index, width) =>
        this._getAction(self.SET_COLUMN_WIDTH, { index, width });

    setColumnOrder = (order) =>
        this._getAction(self.SET_COLUMN_ORDER, order);

    sortBy = (path, shiftKey = false) =>
        this._getAction(self.SORT_BY, { path, shiftKey });

    selectRow = (value, ctrlKey = false, shiftKey = false) =>
        this._getAction(self.SELECT_ROW, { value, ctrlKey, shiftKey });

    setActiveRow = value =>
        this._getAction(self.SET_ACTIVE_ROW, value);

    clearSelection = () =>
        this._getAction(self.CLEAR_SELECTION);

    selectAll = () =>
        this._getAction(self.SELECT_ALL);

    setRowSelected = (value, selected) =>
        this._getAction(self.SET_ROW_SELECTED, { value, selected });

    setError = message =>
        this._getAction(self.SET_ERROR, message);

    //#region Aliases

    firstPage = () => this.goToPage(1);
    lastPage = () => this.goToPage(pagePositions.Last);
    previousPage = () => this.goToPage(pagePositions.Previous);
    nextPage = () => this.goToPage(pagePositions.Next);

    setRowValue = (oldValue, newValue) => this.setRowValues([oldValue, newValue]);

    addRow = item => this.addRows(item);

    patchRow = patch => this.patchRows(patch);

    //#endregion
}

const self = TableActions;
