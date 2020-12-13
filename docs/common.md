## Component props 

#### `name`  *string*

> Required

Used for the generation of the react key properties for the rows and columns. Must be unique per table



#### `columns` *[Column](./column.md)[]*

> Required

The table columns before [ordering][columnOrder]



#### `className` *string*

Passed through to the **table** elements



#### `emptyPlaceholder` *node*

Rendered when the table contains no [visible items][tableItems]



#### `loadingIndicator` *node*

Rendered when the table is [loading][isLoading]



#### `columnOrder` *number[]*

An array of indexes corresponding to item in the [columns array][columns]. Specifies which and in what order the columns will be displayed.



#### `initColumnWidths` *number[]*

An array containing the initial width (in percentage) of every column after [ordering][columnOrder]. If the length of the array doesn't match the number of visible columns, the available width will be distributed equally to all columns.



#### `onContextMenu` *function*

Called when the user right-clicks on a row, the table container, or the empty placeholder

Arguments:

| Type           | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| *Set* \| *any* | If the [list box][listBox] option is enabled, then the value will be passed.<br/>Otherwise, the [selected value(s)][selectedValues] will be passed instead. |



#### `onItemsOpen` *function*

Called when the user double-clicks on a row or presses the enter key. Will not be called if no rows are selected

Arguments:

| Type      | Description                                                 |
| --------- | ----------------------------------------------------------- |
|    *Set* \| *any*   | The [selected value(s)][selectedValues]                     |
| *boolean* | True if caused by enter key press, false if by double click |



#### `onSelectionChanged` *function*

Arguments:

| Type | Description                               |
| ---- | ----------------------------------------- |
|   *Set* \| *any*   | The new [selected value(s)][selectedValues] |

Raised when the selection changes



#### `onColumnsResizeEnd` *function*

Arguments:

| Type       | Description           |
| ---------- | --------------------- |
| *number[]* | The new column widths |

Called when the mouse up event is raised after clicking on a column separator



#### `onKeyDown` *function*

Arguments:

| Type                                                         | Description                             |
| ------------------------------------------------------------ | --------------------------------------- |
| *[KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)* | The javascript keydown event            |
| *Set* \| *any*                                               | The [selected value(s)][selectedValues] |

Raised when the key down event is not handled internally



### Selected values argument

If the [multiple selection][multiSelect] option is enabled, then the [Set of selected values][selectedValues] will be passed.

Otherwise, the single selected value will be passed, or null if no item is selected.



[ columns ]: #columns-column
[ columnOrder ]: #columnorder-number
[selectedValues]: #selected-values-argument



[selection]: ./state.md#selection-set
[activeValue]: ./state.md#activevalue-any
[ tableItems ]: ./state.md#tableItems-object
[isLoading]: ./state.md#isloading-boolean



[ listBox ]: ./options.md#listbox-boolean
[ multiSelect ]: ./options.md#multiselect-boolean