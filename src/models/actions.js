export default class TableActions {
    constructor(tableName) {
        this.tableName = tableName;
    }

    //Rows
    static SET_ROWS = "TABLE_SET_ROWS";
    static ADD_ROW = "TABLE_ADD_ROW";
    static DELETE_ROWS = "TABLE_DELETE_ROWS";
    static REPLACE_ROW = "TABLE_REPLACE_ROW";
    static SET_ROW_VALUE = "TABLE_SET_ROW_VALUE";
    static PATCH_ROW = "TABLE_PATCH_ROW";
    static CLEAR_ROWS = "TABLE_CLEAR_ROWS";
    static SORT_BY = "TABLE_SORT_BY";
    static SET_FILTER = "TABLE_SET_FILTER";
    static SET_VALUE_PROPERTY = "TABLE_SET_VALUE_PROPERTY";

    //Columns
    static SET_COLUMN_WIDTH = "TABLE_SET_COLUMN_WIDTH";
    static SET_COLUMN_ORDER = "TABLE_SET_COLUMN_ORDER";
    static SET_MIN_COLUMN_WIDTH = "TABLE_SET_MIN_COLUMN_WIDTH";

    //Selection
    static SET_ROW_SELECTED = "TABLE_SET_ROW_SELECTED";
    static SELECT_ROW = "TABLE_SELECT_ROW";
    static CLEAR_SELECTION = "TABLE_CLEAR_SELECTION";
    static SELECT_ALL = "TABLE_SELECT_ALL";
    static SET_ACTIVE_ROW = "TABLE_SET_ACTIVE_ROW";
    static CONTEXT_MENU = "TABLE_CONTEXT_MENU";
    static SET_MULTISELECT = "TABLE_SET_MULTISELECT";
    static SET_LISTBOX_MODE = "TABLE_SET_LISTBOX_MODE";

    _getAction(type, payload = null) {
        return { type, table: this.tableName, payload };
    }

    setMinColumnWidth = (percent) =>
        this._getAction(self.SET_MIN_COLUMN_WIDTH, { percent })

    setListboxMode = (isListbox) =>
        this._getAction(self.SET_LISTBOX_MODE, { isListbox });

    setMultiselect = (isMultiselect) =>
        this._getAction(self.SET_MULTISELECT, { isMultiselect });

    setValueProperty = (name) =>
        this._getAction(self.SET_VALUE_PROPERTY, { name });

    clearRows = () =>
        this._getAction(self.CLEAR_ROWS);

    contextMenu = (value, ctrlKey) =>
        this._getAction(self.CONTEXT_MENU, { value, ctrlKey });

    setFilter = (filter) =>
        this._getAction(self.SET_FILTER, { filter });

    patchRow = (value, patch) =>
        this._getAction(self.PATCH_ROW, { value, patch });

    setRowValue = (oldValue, newValue) =>
        this._getAction(self.SET_ROW_VALUE, { oldValue, newValue });

    replaceRow = (value, newItem) =>
        this._getAction(self.REPLACE_ROW, { value, newItem });

    deleteRows = (...values) =>
        this._getAction(self.DELETE_ROWS, { values });

    addRow = (newItem) =>
        this._getAction(self.ADD_ROW, { newItem });

    setRows = (items) =>
        this._getAction(self.SET_ROWS, { data: items });

    setColumnWidth = (index, width) =>
        this._getAction(self.SET_COLUMN_WIDTH, { index, width });

    setColumnOrder = (order) =>
        this._getAction(self.SET_COLUMN_ORDER, { order });

    sortBy = (path) =>
        this._getAction(self.SORT_BY, { path });

    selectRow = (value, ctrlKey = false, shiftKey = false) =>
        this._getAction(self.SELECT_ROW, { value, ctrlKey, shiftKey });

    setActiveRow = (value) =>
        this._getAction(self.SET_ACTIVE_ROW, { value });

    clearSelection = () =>
        this._getAction(self.CLEAR_SELECTION);

    selectAll = () =>
        this._getAction(self.SELECT_ALL);

    setRowSelected = (value, selected) =>
        this._getAction(self.SET_ROW_SELECTED, { value, selected });
}

const self = TableActions;