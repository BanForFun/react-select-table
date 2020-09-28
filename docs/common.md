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

Rendered when the [items array][items] is empty



#### `loadingIndicator` *node*

Rendered when the table is [loading][isLoading]



#### `columnOrder` *number[]*

An array of indexes corresponding to item in the [columns array][columns]. Specifies which and in what order the columns will be displayed.



#### `initColumnWidths` *number[]*

An array containing the initial width (in percentage) of every column after [ordering][columnOrder]. If the length of the array doesn't match the number of visible columns, the available width will be shared equally among all columns.



#### `onContextMenu` *function*

Arguments:

| Type             | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| *any[]* \| *any* | If the [list box][listBox] option is disabled: the [selected values][selectedValues]. Otherwise: the [active value][activeValue] |

Raised when the user right-clicks on a row, the table container, or the empty placeholder



#### `onItemsOpen` *function*

Arguments:

| Type      | Description                                                 |
| --------- | ----------------------------------------------------------- |
| *any[]*   | The [selected values][selectedValues]                       |
| *boolean* | True if caused by enter key press, false if by double click |

Raised when the user double-clicks on a row or presses the enter key. Will not be raised if no rows are selected



#### `onSelectionChanged` *function*

Arguments:

| Type    | Description                               |
| ------- | ----------------------------------------- |
| *any[]* | The new [selected values][selectedValues] |

Raised when the selection changes



#### `onColumnsResizeEnd` *function*

Arguments:

| Type       | Description           |
| ---------- | --------------------- |
| *number[]* | The new column widths |

Called when the mouse up event is raised after clicking on a column separator



#### `onKeyDown` *function*

Arguments:

| Type                                                         | Description                           |
| ------------------------------------------------------------ | ------------------------------------- |
| *[KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)* | The javascript keydown event          |
| *any[]*                                                      | The [selected values][selectedValues] |

Raised when the key down event is not handled internally



[selectedValues]: ./state.md#selectedvalues-any
[activeValue]: ./state.md#activevalue-any
[ items ]: ./state.md#items-any
[isLoading]: ./state.md#isloading-boolean



[ listBox ]: ./options.md#listbox-boolean



[ columns ]: #columns-column
[ columnOrder ]: #columnorder-number