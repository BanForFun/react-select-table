## TableCore usage

### State

#### `sortPath` *string*

> **Default**: `null`
>
> **Modified by**: [`sortBy`](#sortby)

The property name which the items are sorted by. If set to null, sorting is disabled.

Note: The items are [parsed](#itemparser-function) before being sorted.

#### `sortOrder` *string*

> **Default**: `'asc'`
>
> **Modified by**: [`sortBy`](#sortby)
>
> **Valid values**:
>
> * `'asc'` for ascending order
> *  `'desc'` for descending order

The order which the items are sorted by. Has no effect when [`sortPath`](#sortpath-string) is null.

[columnOrder]: #columnorder-array-of-number

#### `columnOrder` *array of number*
> **Default**: `null`
>
> **Modified by**: [`setColumnOrder`](#setColumnOrder)

Used to reorder and/or hide columns. It can be set to an array of indexes corresponding to items in the [`columns`](#columns-array-of-column) array.

If null, all columns passed to the `columns` prop will be rendered.

#### `columnWidth` *array of number*

> **Default**: `[]`
>
> **Modified by**: [`setColumnWidth`](#setColumnWidth)

Array of **[visible][columnOrder]** columns widths as percentages of the table width. On initialization, all columns are set to be of equal width.

[value]: #valueproperty-string

#### `valueProperty` *string*
> **Default**: `null`
>
> **Modified by**: [`setValueProperty`](#setValueProperty)
>
> [**Table prop**](./table.md#valueproperty-string)

Property path that contains a unique value for each item (ex. `id`). 

#### `selectedValues` *array of any*

[selection]: #selectedvalues-array-of-any

> **Default**: `[]`
>
> **Modified by**: [`setRows`](#setRows), [`deleteRows`](#deleteRows), [`setRowValue`](#setRowValue), [`clearRows`](#clearRows), [`setFilter`](#setFilter), [`selectRow`](#selectRow), [`clearSelection`](#clearSelection), [`setRowSelected`](#setRowSelected), [`selectAll`](#selectAll), [`contextMenu`](#contextMenu), [`setMultiselect`](#setMultiselect), [`setValueProperty`](#setValueProperty)

Array of selected [values][value]. By default, selected items have light green background color.

#### `activeValue` *any*

> **Default**: `null`
>
> **Modified by**: [`setRows`](#setRows), [`deleteRows`](#deleteRows), [`setRowValue`](#setRowValue), [`clearRows`](#clearRows), [`setFilter`](#setFilter), [`selectRow`](#selectRow), [`clearSelection`](#clearSelection), [`setActiveRow`](#setactiverow), [`contextMenu`](#contextMenu), [`setValueProperty`](#setValueProperty)

Active [value][value]. By default, the active item has green bottom border.

#### `filter` *any*
> **Default**: `null`
>
> **Modified by**: [`setFilter`](#setFilter)
>
> [**Table prop**](./table.md#filter-any)

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
>
> **Modified by**: [`setRows`](#setRows), [`addRow`](#addRow), [`deleteRows`](#deleteRows), [`replaceRow`](#replaceRow), [`setRowValue`](#setRowValue), [`patchRow`](#patchRow), [`clearRows`](#clearRows),  [`setValueProperty`](#setValueProperty)

Unparsed, unsorted and unfiltered items keyed by [value][value].

#### `pivotValue` *any*
> **Default**: `null`
>
> **Modified by**: [`clearRows`](#clearRows), [`clearSelection`](#clearSelection), [`setValueProperty`](#setValueProperty), [`selectRow`](#selectRow), [`setActiveRow`](#setactiverow), [`contextMenu`](#contextMenu)

The [value][value] of the item that is used to pivot the selection on `Shift`+`Click`/`Up`/`Down`.

#### `tableItems` *array of object*
> **Default**: `[]`
>
> **Modified by**: [`setRows`](#setRows), [`addRow`](#addRow), [`deleteRows`](#deleteRows), [`replaceRow`](#replaceRow), [`setRowValue`](#setRowValue), [`patchRow`](#patchRow), [`clearRows`](#clearRows), [`sortBy`](#sortBy), [`setFilter`](#setFilter), [`setValueProperty`](#setValueProperty)

 [Parsed](#itemparser-function), [sorted](#sortpath-string) and [filtered](#filter-any) items.

If an item has a `className` property set to an array of CSS class name strings, they will be applied to the `tr` element.

#### `isLoading` *boolean*
> **Default**: `true`
>
> **Modified by**: [`setRows`](#setRows), [`clearRows`](#clearRows)

Can be used to conditionally display a loading indicator. Initially set to `true`.

[`setRows`](#setrows) action sets it to `false`. 

[`clearRows`](#clearrows) action sets it to `true`.

#### `isMultiselect` *boolean*
> **Default**: `true`
>
> **Modified by**: [`setMultiselect`](#setMultiselect)
>
> [**Table prop**](./table.md#ismultiselect-boolean)

If set to false, the following features are disabled:

* `Shift`+ `Home`/`End`/`Up`/`Down`
* `Ctrl`/`Shift`  + `Click`
* `Ctrl` + `A`
* Drag selection.

#### `isListbox` *boolean*
> **Default**: `false`
>
> **Modified by**: [`setListboxMode`](#setListboxMode)
>
> [**Table prop**](./table.md#islistbox-boolean)

If set to true:

* Clicking on empty space below the items won't clear the selection.
* Right clicking won't select the row below the cursor, it will just be set to [active](#activevalue-any).
* The [active value](#activevalue-any) will be passed to [`onContextMenu`](./common.md#oncontextmenu-function) instead of the selected values.
* Drag selection is disabled.

#### `minColumnWidth` *number*
> **Default**: `3`
>
> **Modified by**: [`setMinColumnWidth`](#setMinColumnWidth)
>
> [**Table prop**](./table.md#mincolumnwidth-number)

The minimum column width percentage relative to the table width.



### Actions

The action creators and the type constants are exported from a `TableActions` instance. The constructor takes the table [name](#name-string) as a parameter.

```react
import { TableActions } from "react-select-table";
const todoActions = new TableActions("todo");

//For example to set the table rows you can use
store.dispatch(todoActions.setRows([
    //...items
]))

//You can also access the action types
switch(action.type) {
    case todoActions.SET_ROWS:
        console.log("New rows", action.items);
        break;
}
```

For the action types below, the exported property name is listed. The actual string is: *table name* (in uppercase) + *underscore* (`_`) + *property name*. For example the property `SET_ROWS` with table name `todos` would return `TODOS_SET_ROWS`.

#### `setRows`

> **Type**: `SET_ROWS`

Parameters:

* `items` *array of object*

Sets item list to `items`. Sets [`isLoading`](#isloading-boolean) state to false.

#### `setMinColumnWidth`

> **Type**: `SET_MIN_COLUMN_WIDTH`

Parameters:

* `percent` *number*

Sets [`minColumnWidth`](#mincolumnwidth-number) state to `percent`. If a column is smaller than `percent` it will **not** be resized to the minimum width. Takes effect on the next resize.

#### `setListboxMode`

> **Type**: `SET_LISTBOX_MODE`

Parameters:

* `isListbox` *boolean*

Sets [`isListbox`](#islistbox-boolean) state to `isListbox`.

#### `setMultiselect`

> **Type**: `SET_MULTISELECT`

Parameters:

* `isMultiselect` *boolean*

Sets [`isMultiselect`](#ismultiselect-boolean) state to `isMultiselect`. If `isMultiselect` is false and more than one item is currently selected, only the item that was selected first will stay as such.

#### `setValueProperty`

> **Type**: `SET_VALUE_PROPERTY`

Parameters:

* `name` *string*

Sets [`valueProperty`][value] state to `name`. Clears the selection.

#### `clearRows`

> **Type**: `CLEAR_ROWS`

Parameters: none

Removes all items. Sets [`isLoading`](#isloading-boolean) state to true. Clears the selection.

#### `contextMenu`

> **Type**: `CONTEXT_MENU`

Parameters:

* `value` *any*
* `ctrlKey` *boolean*

Modifies the selection based on the item that was right-clicked, and whether the `Ctrl` key was pressed at the time.

#### `setFilter`

> **Type**: `SET_FILTER`

Parameters: 

* `filter` *any*

Sets [`filter`](#filter-any) state to `filter`. Updates the items based on the new filter.

#### `patchRow`

> **Type**: `PATCH_ROW`

Parameters:

* `value` *any*
* `patch` *object*

Finds the item with [value][value]: `value` and copies the properties of `patch` to it.

**Warning**: Don't use `patchRow` to change an item's value, as the selection will not be updated. Use [`setRowValue`](#setrowvalue) instead.

#### `setRowValue`

> **Type**: `SET_ROW_VALUE`

Parameters:

* `oldValue` *any*
* `newValue` *any*

Finds the item with [value][value]: `oldValue` and changes its value to `newValue`.

#### `replaceRow`

> **Type**: `REPLACE_ROW`

Parameters:

* `value` *any*
* `newItem` *object*

Finds the item with [value][value]: `value` and replaces it with `newItem`.

#### `deleteRows`

> **Type**: `DELETE_ROWS`

Parameters:

* `...values` *parameter array of any*

Deletes all items who's [values][value] are included in `values`.

#### `addRow`

> **Type**: `ADD_ROW`

Parameters:

* `newItem` *object*

Adds `newItem` to the item list.

#### `setColumnWidth`

> **Type**: `SET_COLUMN_WIDTH`

Parameters:

* `index` *number*
* `width` *number*

Resizes the **[visible][columnOrder]** column at `index` to `width`.

#### `setColumnOrder`

> **Type**: `SET_COLUMN_ORDER`

Parameters:

* `order` *array of number*

Sets [`columnOrder`](#columnorder-array-of-number) state to `order`.

#### `sortBy`

> **Type**: `SORT_BY`

Parameters:

* `path` *string*

Sets [`sortPath`](#sortpath-string) state to `path`. If `sortPath` is already set to `path`, [`sortOrder`](#sortorder-string) is toggled between ascending and descending. Otherwise it is set to ascending.

#### `selectRow`

> **Type**: `SELECT_ROW`

Parameters:

* `value` *any*
* `ctrlKey` *boolean* (Optional, `false` by default)
* `shiftKey` *boolean* (Optional, `false` by default)

Modifies the selection based on the item that was clicked, and whether the `Ctrl ` or `Shift` keys were held down at the time.

#### `setActiveRow`

> **Type**: `SET_ACTIVE_ROW`

Parameters:

* `value` *any*

Sets [`activeValue`](#activevalue-any) and [`pivotValue`](#pivotvalue-any) state to `value`.

#### `clearSelection`

> **Type**: `CLEAR_SELECTION`

Parameters: none

Sets [`activeValue`](#activevalue-any) to null. Clears the selection if [`isLisbox`](#islistbox-boolean) is false.

#### `selectAll`

> **Type**: `SELECT_ALL`

Parameters: none

Selects all items. Has no effect when [`isMultiselect`](#ismultiselect-boolean) is false.

#### `setRowSelected`

> **Type**: `SET_ROW_SELECTED`

Parameters:

* `value` *any*
* `selected` *boolean*

Finds the item with [value][value]: `value` and selects or deselects it, based on `selected`.



### TableCore props

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

Used to generate the redux [action](#actions) types if [`reducerName`](#reducername-string) is not provided.

#### `context` *context*

> **Required**

You can import the default redux context using:

```react
import { ReactReduxContext } from "react-redux";
```

`ReactReduxContext` must be passed to the `context` prop.

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

#### `statePath` *string*

> **Default**: `null`

If the table reducer isn't the root, you can set the path where the table reducer is located. The path is resolved using lodash's `_.get` method, meaning that dot notation can be used. If the table reducer is the root, you don't have to provide this prop.

#### `reducerName` *string*

> **Default**: `null`

If you have two (or more) tables that you want controlling a common reducer, you can set this property to the [reducer name](#reducer). Then you can set the table components' [`name`](#name-string) properties to unique values, but the actions dispatched will be of the same type for all tables.

### Event props

The event handlers (except `onItemsOpen`) are called from inside the reducer. If you try to dispatch an action as the result of an event, you will get an error. To do that, you must handle the actions using middleware.

#### `onContextMenu` _function_

> **Default**: `() => {}`
>
> [**Table prop**](./table.md#oncontextmenu-function)

| Parameter | Type           | Description                                                  |
| --------- | -------------- | ------------------------------------------------------------ |
| `values`  | *Array of any* | If [`isListbox`](#islistbox-boolean) is false (default), the [selected values](#selectedvalues-array-of-any).<br/>Otherwise, the [active value](#activevalue-any) in an array |

Called when the user right-clicks on a row or the table container.

#### `onItemsOpen` _function_

> **Default**: `() => {}`
>
> [**Table prop**](./table.md#onitemsopen-function)

| Name       | Type           | Description                                                 |
| ---------- | -------------- | ----------------------------------------------------------- |
| `values`   | *Array of any* | The [selected values](#selectedvalues-array-of-any)         |
| `enterKey` | *Boolean*      | True if caused by enter key press, false if by double click |

Called when the user double-clicks or presses the enter key. Will not be called if no rows are selected.

#### `onSelectionChange` _function_

> **Default**: `() => {}`
>
> [**Table prop**](./table.md#onselectionchange-function)

| Parameter | Type           | Description                                         |
| --------- | -------------- | --------------------------------------------------- |
| `values`  | *Array of any* | The [selected values](#selectedvalues-array-of-any) |

Called when the [selection][selection] changes.



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
>   if (!filter) return true;
> 
>   for (let key in filter) {
>       if (item[key] !== filter[key])
>          return false;
>   }
> 
>   return true;
> }
> ```

| Parameter | Type     | Description                                |
| --------- | -------- | ------------------------------------------ |
| `item`    | *Object* | Table item to filter                       |
| `filter`  | *Any*    | The [`filter`](#filter-any) state property |

Called for each row to decide whether it should be displayed.

Note: The items will be [parsed](#itemparser-function) before being filtered.



### Reducer

To create a reducer, use the `createTable` exported by `TableReducer`. 

Parameters:

* `tableName` *string*

* `initState` *object* (Optional)

* `options` *[Options](#options-object)* (Optional)

Properties that in most cases remain constant like `valueProperty`, `minColumnWidth`, `isListbox` and `isMultiselect`, are recommended to be set inside `initState` instead of being set later. See all available `initState` properties [here](#state).

**Reducer**

```javascript
import { TableReducer } from "react-select-table";
import { combineReducers } from "redux";

export default rootReducer = combineReducers({
    //...Other reducers
    todoTable: TableReducer.createTable("todos", {
        valueProperty: "id",
        isListbox: true
    })
})
```

**Component**

```react
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { TableCore, TableActions } from "react-select-table";

const { setItems } = new TableActions("todos");

function App() {
    const dispatch = useDispatch();
    
    useEffect(() => {
        // getTodos is an async method that makes a request to an api 
        // and returns an array
        getTodos().then(todos => dispatch(setItems(todos))); 
    }, [dispatch]);
    
    return (
    	<TableCore name="todos"
            statePath="todoTable"
            // ...Other props like columns etc.
        />
    )
}


export default App;
```



### Troubleshooting

#### No reducer found at '\<path\>'

Ensure that `createTable` was called as shown in the [reducer](#reducer) section and that the key of the reducer inside `combineReducers` matches the TableCore component's [`statePath`](#statePath-string) prop.