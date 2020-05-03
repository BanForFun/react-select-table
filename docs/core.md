## TableCore usage

### State

#### `sortPath` *string*

> **Default**: `null`

The property name which the items are sorted by. If set to null, sorting is disabled.

Note: The items are [parsed](./common.md#itemparser-function) before being sorted.

#### `sortOrder` *string*

> **Default**: `'asc'`
>
> **Valid values**:
>
> * `'asc'` for ascending order
> *  `'desc'` for descending order

The order which the items are sorted by. Has no effect when [`sortPath`](#sortpath-string) is null.

#### `columnOrder` *array of number*

> **Default**: `null`

Used to reorder and/or hide columns. It can be set to an array of indexes corresponding to items in the [`columns`](#columns-array-of-item) array.

If null, all columns passed to the [`columns`](#columns-array-of-item) prop will be rendered in the default order.

#### `columnWidth` *array of number*

> **Default**: `[]`

Array of columns widths as percentages of the table width. On initialization, all columns are set to be of equal width.

#### `valueProperty` *string*

> **Default**: `null`

Property path that contains a unique value for each item (ex. `id`). 

#### `selectedValues` *array of any*

> **Default**: `[]`

Array of selected [values](#valueproperty-string). By default, selected items have light green background color.

#### `activeValue` *any*

> **Default**: `null`

Active [value](#valueproperty-string). By default, the active item has dark green bottom border.

#### `filter` *any*
> **Default**: `null`

Passed as the second parameter to [`itemPredicate`](#itempredicate-function).

__With the default implementation of `itemPredicate`__, this object can contain key-value pairs of property paths and matching values. For example:

```javascript
{
    id: "1",
    title: "react-select-table",
    author: "BanForFun"
}
```

The above filter will only allow rows that have a `title` property set to `"react-select-table"` and an `author` property set to `"BanForFun"`. Any extra properties will be ignored (Like `id` in this instance).

#### `items` *object*
> **Default**: `{}`

Unparsed, unsorted and unfiltered items keyed by [value](#valueproperty-string).

#### `pivotValue` *any*
> **Default**: `null`

The [value](#valueproperty-string) of the item that is used to pivot the selection on `Shift`+`Click`/`Up`/`Down`.

#### `tableItems` *array of object*
> **Default**: `[]`

 [Parsed](./common.md#itemparser-function), [sorted](#sortpath-string) and [filtered](#filter-any) items.

#### `isLoading` *boolean*
> **Default**: `true`

Can be used to conditionally display a loading indicator. Initially set to `true`.

`TABLE_SET_ROWS ` action sets it to `false`. 

`TABLE_CLEAR_ROWS` action sets it to `true`.

#### `isMultiselect` *boolean*
> **Default**: `true`

If set to false, the following features are disabled:

* `Shift`+ `Home`/`End`/`Up`/`Down`
* `Ctrl`/`Shift`  + `Click`
* `Ctrl` + `A`
* Drag selection.

#### `isListbox` *boolean*
> **Default**: `false`

If set to true:

* Clicking on empty space below the items won't clear the selection.
* Right clicking won't select the row below the cursor, it will just be set to active.
* The active value will be passed to [`onContextMenu`](./common.md#oncontextmenu-function) instead of the selected values.
* Drag selection is disabled.

#### `minColumnWidth` *number*
> **Default**: `3`

The minimum column width percentage relative to the table width.



### Action creators

The action creators and the type constants are exported from `TableStore`. 

```react
import { TableStore } from "react-select-table"

//For example to set the table rows you can use
store.dispatch(TableStore.setRows([
    //...items
]))
```

#### `setMinColumnWidth`

> **Type**: `TABLE_SET_MIN_COLUMN_WIDTH`

#### `setListboxMode`

> **Type**: `TABLE_SET_LISTBOX_MODE`

#### `setMultiselect`

> **Type**: `TABLE_SET_MULTISELECT`

#### `setValueProperty`

> **Type**: `TABLE_SET_VALUE_PROPERTY`

#### `clearRows`

> **Type**: `TABLE_CLEAR_ROWS`

#### `contextMenu`

> **Type**: `TABLE_CONTEXT_MENU`

#### `setFilter`

> **Type**: `TABLE_SET_FILTER`

#### `patchRow`

> **Type**: `TABLE_PATCH_ROW`

#### `setRowValue`

> **Type**: `TABLE_SET_ROW_VALUE`

#### `replaceRow`

> **Type**: `TABLE_REPLACE_ROW`

#### `deleteRows`

> **Type**: `TABLE_DELETE_ROWS`

#### `addRow`

> **Type**: `TABLE_ADD_ROW`

#### `setRows`

> **Type**: `TABLE_SET_ROWS`

#### `setColumnWidth`

> **Type**: `TABLE_SET_COLUMN_WIDTH`

#### `setColumnOrder`

> **Type**: `TABLE_SET_COLUMN_ORDER`

#### `sortBy`

> **Type**: `TABLE_SORT_BY`

#### `selectRow`

> **Type**: `TABLE_SELECT_ROW`

#### `setActiveRow`

> **Type**: `TABLE_SET_ACTIVE_ROW`

#### `clearSelection`

> **Type**: `TABLE_CLEAR_SELECTION`

#### `selectAll`

> **Type**: `TABLE_SELECT_ALL`

#### `setRowSelected`

> **Type**: `TABLE_SET_ROW_SELECTED`





### TableCore Props

#### `columns` _array of [Column](#column-object)_

> __Required__
>
> [**Table prop**](./table.md#columns-array-of-column)

The table columns. Don't worry about their order or whether some shouldn't be displayed, those functions can be accomplished by setting [`columnOrder`](#columnorder-array-of-number). 

#### `name` _string_

> __Required__
>
> [**Table prop**](./table.md#name-string)

Used for the generation of the react `key` properties for the rows and columns.

#### `className` *string*

> **Default:** `""`
>
> [**Table prop**](./table.md#classname-string)

Compatible with styles designed for html table elements (for example bootstrap's `table` class).

#### `emptyPlaceholder` _component_

> **Default**: `null`
>
> [**Table prop**](./table.md#emptyplaceholder-component)

Rendered when the table contains no items.

### Event props

The event handlers are called from inside the reducer. If you try to dispatch an action as the result of an event, you will get an error. To do that, you must handle the actions using middleware.

#### `onContextMenu` _function_

> **Default**: `() => {}`
>
> [**Table prop**](./table.md#oncontextmenu-function)

Called when the user right-clicks on a row or the table container.

| Parameter | Type           | Description                                                  |
| --------- | -------------- | ------------------------------------------------------------ |
| `values`  | *Array of any* | If [`isListbox`](#islistbox-boolean) is false (default), the [selected values](#selectedvalues-array-of-any)<br/>Otherwise, the [active value](#activevalue-any) in an array |

#### `onItemsOpen` _function_

> **Default**: `() => {}`
>
> [**Table prop**](./table.md#onitemsopen-function)

Called when the user double-clicks or presses the enter key. 

This event will not be raised if no rows are selected, meaning that `values` can never be empty.

| Parameter  | Type           | Description                                                 |
| ---------- | -------------- | ----------------------------------------------------------- |
| `values`   | *Array of any* | The [selected values](#selectedvalues-array-of-any)         |
| `enterKey` | *Boolean*      | True if caused by enter key press, false if by double click |

#### `onSelectionChange` _function_

> **Default**: `() => {}`
>
> [**Table prop**](./table.md#onselectionchange-function)

Called when the selection changes.

| Parameter | Type           | Description                                         |
| --------- | -------------- | --------------------------------------------------- |
| `values`  | *Array of any* | The [selected values](#selectedvalues-array-of-any) |



### Column *object*

#### `title` *string*
This text will be displayed in the header.

#### `path` *string*
The property value of each row at `path` will be resolved and passed to the [`render`](#render-function) method as the first parameter, followed by the complete row object as the second one. If `path` is not set, the first parameter will be undefined. 

Columns that specify a `path`, are sortable. If that is not desirable (for example on images), you should not specify a `path` and instead resolve the property inside the `render` method.

If you don't set the `path` property, you must set the [`key`](#key-string) property instead.

#### `render`  *function*

Called for each cell to return the content of the td element. For parameters, see [`path`](#path-string).

#### `key` *string*

Used for the generation of the react `key` properties for the cells. Must be unique for each column.

If [`path`](#path-string) is set, you needn't set the `key` property, as `path` will be used for the same purpose.

#### `isHeader` *boolean*
If set to true, a th element will be used instead of td for the cell rendering.



### Options *object*

> **Used in:**
>
> * [`useTableStore`/`configureTableStore`](./table.md#setup)
> * `createTable`

#### `itemParser` _Function_

> **Returns:** *object*
>
> **Default**: `item => item`

| Parameter | Type     | Description         |
| --------- | -------- | ------------------- |
| `item`    | *Object* | Table item to parse |

Called for each row before adding it to the table. Returns the modified row.

#### `itemPredicate` _Function_

> **Returns**: *boolean*
>
> **Default**: 
>
> ```javascript
> (item, filter) => {
> if (!filter) return true;
> 
> for (let key in filter) {
>   if (item[key] !== filter[key])
>       return false;
> }
> 
> return true;
> }
> ```

| Parameter | Type     | Description                                |
| --------- | -------- | ------------------------------------------ |
| `item`    | *Object* | Table item to filter                       |
| `filter`  | *Any*    | The [`filter`](#filter-any) state property |

Called for each row to decide whether it should be displayed.

Note: The items will be [parsed](#itemparser-function) before being filtered.