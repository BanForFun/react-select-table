## Component props 

#### `namespace`  *string*

>  Required

Used to connect the table component with the redux store.

In rare cases, you may want two tables to be linked. That can be done by giving them a common namespace in which case everything will be linked except:

* The column widths
* The column order
* The selection <u>rectangle</u> (the selection itself will be linked)

#### `columns` *[Column](./column.md)*[]

> Required

The table columns before [ordering][columnOrder]

#### `name`  *string*

Used in the generation of the [react keys](https://reactjs.org/docs/lists-and-keys.html#keys) for the rows and columns, so it must be unique between rendered tables.

[`namespace`](#namespace-string) will be implicitly used as the name. If multiple table share a namespace, then you should set their names to different ones.

#### `className` *string*

Passed through to the `table` elements

#### `emptyPlaceholder` *node*

Rendered when the [item array][tableItems] is empty

#### `loadingIndicator` *node*

Rendered when the table is [loading](isLoading)

#### `columnOrder` *number*[]

An array of indexes corresponding to items in the [`columns`][columns] prop. Specifies which and in what order the columns will be displayed.

#### `initColumnWidths` *number*[]

An array containing the initial width (in percentage) of every column after [ordering][columnOrder]. If the length of the array doesn't match the number of visible columns, the available width will be distributed equally to all columns.

#### `onContextMenu` *function*

Called when the user right-clicks on a row, the table container, or the empty placeholder

Arguments:

1. *[Set][set] \| any*

   If the [list box][listBox] option is enabled, the value of the row which the user right-clicked will be passed (or null if below items)

   If the [list box][listBox] option is enabled, and the Ctrl key is pressed, the value of the active (underlined) row will be passed

   Otherwise, the [selected value(s)][selectedValues] will be passed

#### `onItemsOpen` *function*

Called when the user double-clicks on a row or presses the enter key. Will not be called if no rows are selected

Arguments:

1. *[Set][set] \| any*

   The [selected value(s)][selectedValues]

2. *boolean*

   True if caused by enter key press

   False if caused by double click

#### `onSelectionChanged` *function*

Called when the selection changes

Arguments:

1. *[Set][set] \| any*

   The new [selected value(s)][selectedValues]

#### `onColumnsResizeEnd` *function*

Called when the mouse up event is raised after clicking on a column separator

Arguments:

1. *number*[]

   The new column widths

#### `onKeyDown` *function*

Called when the key down event is not handled internally

Arguments:

1. *[KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)*

   The original keydown event

2. *[Set][set] \| any*

   The [selected value(s)][selectedValues]

### Selected values argument

If the [multi select][multiSelect] option is enabled, then the whole [selection][selection] will be passed.

Otherwise, the single selected value will be passed, or null if no item is selected.



[set]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set



[ columns ]: #columns-column
[ columnOrder ]: #columnorder-number
[selectedValues]: #selected-values-argument



[selection]: ./state.md#selection-set
[activeValue]: ./state.md#activevalue-any
[ tableItems ]: ./state.md#tableItems-object
[isLoading]: ./state.md#isloading-boolean



[ listBox ]: ./options.md#listbox-boolean
[ multiSelect ]: ./options.md#multiselect-boolean