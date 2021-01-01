# Component props

### `namespace`  *string*

**Required**

Used to connect the table component with the redux store.

In rare cases, you may want two tables to be linked. That can be done by giving them a common namespace in which case everything will be linked except:

* The column widths
* The column order
* The drag selection rectangle (the selection itself will be linked)

### `columns` *[column](./column.md)[]*

**Required**

The table columns before [ordering][columnOrder].

### `name`  *string*

**Default:** Copied from [`namespace`](#namespace-string)

If multiple table share a namespace, then they must have unique names.

### `className` *string*

**Default**: `rst-table`

Applied to the root element (of class `rst-container`)

### `id` *string*

Applied to the root element (of class `rst-container`)

### `itemContainerRef` [*react ref*](https://reactjs.org/docs/refs-and-the-dom.html#creating-refs)

A reference to the item container (of class `rst-scrollingContainer`). This element handles the keystrokes but should be given focus to do so. 

### `scrollFactor` *number*

**Default:** `0.2`

The speed of the automatic scrolling when drag selecting or resizing columns.

### `emptyPlaceholder` *node*

**Default:** `null`

Rendered instead of the table body when the [item array][] is empty.

### `loadingIndicator` *node*

**Default:** `null`

Rendered instead of the table when [loading][] is truthy.

### `showSelectionRect` *boolean*

**Default:** `true`

Whether the drag-selection rectangle will be calculated and rendered.

### `Error` *elementType*

**Default:** [`DefaultError`](../src/components/DefaultError.jsx)

Rendered instead of the table when [error][] is truthy.

Component props:

* `error` *any* 

  The error

### `Pagination` *elementType*

**Default:** [`DefaultPagination`](../src/components/DefaultPagination.jsx)

Rendered below the table when the [page size][] isn't zero.

Component props:

* `pageCount` *number*

  The total number of pages, or 0 if pagination is disabled

* `page` *number*

  The current page number

* `goToPage` *function*

  Calls `goToPage` action creator and dispatches result

### `columnOrder` *number[]*

An array with indexes of the [columns][] array. Specifies which and in what order the columns will be displayed.

If not specified, the columns will be rendered in the normal order.

### `initColumnWidths` *number[]*

**Default**: `[]`

An array containing the initial width (in percentage) of every column after [ordering][columnOrder]. 

If the length of the array doesn't match the number of visible columns, the available width will be distributed equally to all columns.

### `onContextMenu` *function*

Called when the user right-clicks on a row, the table container, or the empty placeholder

Arguments:

1. If the [list box][] option is enabled, the value of the row that was right-clicked on will be passed (null if below items)

   If the [list box][] option is enabled, and the Ctrl key is pressed, the value of the [active row][] will be passed

   Otherwise, the [selected value(s)][selectedValues] will be passed

### `onItemsOpen` *function*

Called when the user double-clicks on a row or presses the enter key. Will not be called if no rows are selected

Arguments:

1. The [selected value(s)][selectedValues]

2. True if caused by enter key press

   False if caused by double-click

### `onSelectionChanged` *function*

Called when the selection changes

Arguments:

1. The new [selected value(s)][selectedValues]

### `onColumnsResizeEnd` *function*

Called when the mouse up event is raised after clicking on a column separator

Arguments:

1. The new column widths as an array of percentages

### `onKeyDown` *function*

Called when the key down event is not handled internally

Arguments:

1. The javascript keydown event argument

2. The [selected value(s)][selectedValues]



## Selected values argument

If the [multi select][] option is disabled, the single selected value will be passed, or null if no item is selected. 

Otherwise, the entire [selection][] will be passed instead.



[columns]: #columns-column

[columnOrder]: #columnorder-number

[selectedValues]: #selected-values-argument



[selection]: ./state.md#selection-set

[active row]: ./state.md#activeindex-number

[item array]: ./state.md#tableItems-object

[loading]: ./state.md#isloading-boolean

[error]: ./state.md#error-any



[list box]: ./options.md#listbox-boolean

[multi select]: ./options.md#multiselect-boolean
