export default class TableActions {
    constructor(name) {
        this.name = name.toUpperCase();
    }

    //Rows
    get SET_ROWS() { return `${this.name}_SET_ROWS`; }
    get ADD_ROW() { return `${this.name}_ADD_ROW`; }
    get DELETE_ROWS() { return `${this.name}_DELETE_ROWS`; }
    get REPLACE_ROW() { return `${this.name}_REPLACE_ROW`; }
    get SET_ROW_VALUE() { return `${this.name}_SET_ROW_VALUE`; }
    get PATCH_ROW() { return `${this.name}_PATCH_ROW`; }
    get CLEAR_ROWS() { return `${this.name}_CLEAR_ROWS`; }
    get SORT_BY() { return `${this.name}_SORT_BY`; }
    get SET_FILTER() { return `${this.name}_SET_FILTER`; }
    get SET_VALUE_PROPERTY() { return `${this.name}_SET_VALUE_PROPERTY`; }

    //Columns
    get SET_COLUMN_WIDTH() { return `${this.name}_SET_COLUMN_WIDTH`; }
    get SET_COLUMN_ORDER() { return `${this.name}_SET_COLUMN_ORDER`; }
    get SET_MIN_COLUMN_WIDTH() { return `${this.name}_SET_MIN_COLUMN_WIDTH`; }

    //Selection
    get SET_ROW_SELECTED() { return `${this.name}_SET_ROW_SELECTED`; }
    get SELECT_ROW() { return `${this.name}_SELECT_ROW`; }
    get CLEAR_SELECTION() { return `${this.name}_CLEAR_SELECTION`; }
    get SELECT_ALL() { return `${this.name}_SELECT_ALL`; }
    get SET_ACTIVE_ROW() { return `${this.name}_SET_ACTIVE_ROW`; }
    get CONTEXT_MENU() { return `${this.name}_CONTEXT_MENU`; }
    get SET_MULTISELECT() { return `${this.name}_SET_MULTISELECT`; }
    get SET_LISTBOX_MODE() { return `${this.name}_SET_LISTBOX_MODE`; }

    setMinColumnWidth = (percent) =>
        ({ type: this.SET_MIN_COLUMN_WIDTH, percent })

    setListboxMode = (isListbox) =>
        ({ type: this.SET_LISTBOX_MODE, isListbox });

    setMultiselect = (isMultiselect) =>
        ({ type: this.SET_MULTISELECT, isMultiselect })

    setValueProperty = (name) =>
        ({ type: this.SET_VALUE_PROPERTY, name });

    clearRows = () =>
        ({ type: this.CLEAR_ROWS });

    contextMenu = (value, ctrlKey) =>
        ({ type: this.CONTEXT_MENU, value, ctrlKey });

    setFilter = (filter) =>
        ({ type: this.SET_FILTER, filter });

    patchRow = (value, patch) =>
        ({ type: this.PATCH_ROW, value, patch });

    setRowValue = (oldValue, newValue) =>
        ({ type: this.SET_ROW_VALUE, oldValue, newValue });

    replaceRow = (value, newItem) =>
        ({ type: this.REPLACE_ROW, value, newItem });

    deleteRows = (...values) =>
        ({ type: this.DELETE_ROWS, values });

    addRow = (newItem) =>
        ({ type: this.ADD_ROW, newItem });

    setRows = (items) =>
        ({ type: this.SET_ROWS, data: items });

    setColumnWidth = (index, width) =>
        ({ type: this.SET_COLUMN_WIDTH, index, width });

    setColumnOrder = (order) =>
        ({ type: this.SET_COLUMN_ORDER, order });

    sortBy = (path) =>
        ({ type: this.SORT_BY, path });

    selectRow = (value, ctrlKey = false, shiftKey = false) =>
        ({ type: this.SELECT_ROW, value, ctrlKey, shiftKey });

    setActiveRow = (value) =>
        ({ type: this.SET_ACTIVE_ROW, value });

    clearSelection = () =>
        ({ type: this.CLEAR_SELECTION });

    selectAll = () =>
        ({ type: this.SELECT_ALL });

    setRowSelected = (value, selected) =>
        ({ type: this.SET_ROW_SELECTED, value, selected });
}