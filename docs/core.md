## TableCore usage

### State

#### `sortBy` *object*

> **Default**: `{}`
>
> **Modified by**: [`sortBy`](#sortby)

*Keys*: The property path to sort the items by

*Values*: The order in which to sort them (`asc` for ascending, `desc` for descending).

If [`multiSort`](./types.md#multisort-boolean) is set to false (default), this object will only contain at most one key-value pair.

Note: The items are [parsed](#itemparser-function) before being sorted.

#### `columnOrder` *array of number*
> **Default**: `null`
>
> **Modified by**: [`setColumnOrder`](#setColumnOrder)

Used to reorder and/or hide columns. It can be set to an array containing indexes of items in the [`columns`](#columns-array-of-column) array.

If null, all columns passed to the [`columns`][columns] prop will be rendered.

#### `columnWidth` *array of number*

> **Default**: `[]`
>
> **Modified by**: [`setColumnWidth`](#setColumnWidth)

Array of **[visible][columnOrder]** columns widths as percentages of the table width. On initialization, all columns are set to be of equal width.

#### `selectedValues` *array of any*

> **Default**: `[]`
>
> **Modified by**: [`setRows`](#setRows), [`deleteRows`](#deleteRows), [`setRowValue`](#setRowValue), [`clearRows`](#clearRows), [`setFilter`](#setFilter), [`selectRow`](#selectRow), [`clearSelection`](#clearSelection), [`setRowSelected`](#setRowSelected), [`selectAll`](#selectAll), [`contextMenu`](#contextMenu)

Array of selected [values][value]. By default, selected items have light green background color.

#### `activeValue` *any*

> **Default**: `null`
>
> **Modified by**: [`setRows`](#setRows), [`deleteRows`](#deleteRows), [`setRowValue`](#setRowValue), [`clearRows`](#clearRows), [`setFilter`](#setFilter), [`selectRow`](#selectRow), [`clearSelection`](#clearSelection), [`setActiveRow`](#setactiverow), [`contextMenu`](#contextMenu)

Active [value][value]. By default, the active item has green bottom border.

#### `filter` *any*
> **Default**: `null`
>
> **Modified by**: [`setFilter`](#setFilter)

Passed as the second parameter to [`itemPredicate`](./types.md#itempredicate-function).

__With the default implementation of `itemPredicate`__, this object can contain key-value pairs of property paths and matching values.

For example:

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
> **Modified by**: [`setRows`](#setRows), [`addRow`](#addRow), [`deleteRows`](#deleteRows), [`replaceRow`](#replaceRow), [`setRowValue`](#setRowValue), [`patchRow`](#patchRow), [`clearRows`](#clearRows)

Unparsed, unsorted and unfiltered items keyed by [value][value].

#### `pivotValue` *any*
> **Default**: `null`
>
> **Modified by**: [`clearRows`](#clearRows), [`clearSelection`](#clearSelection), [`selectRow`](#selectRow), [`setActiveRow`](#setactiverow), [`contextMenu`](#contextMenu)

The [value][value] of the item that is used to pivot the selection on `Shift`+`Click`/`Up`/`Down`.

#### `tableItems` *array of object*
> **Default**: `[]`
>
> **Modified by**: [`setRows`](#setRows), [`addRow`](#addRow), [`deleteRows`](#deleteRows), [`replaceRow`](#replaceRow), [`setRowValue`](#setRowValue), [`patchRow`](#patchRow), [`clearRows`](#clearRows), [`sortBy`](#sortBy), [`setFilter`](#setFilter)

[Parsed](#itemparser-function), [sorted](#sortpath-string) and [filtered](#filter-any) items.

If an item has a `className` property set to an array of CSS class name strings, they will be applied to the `tr` element.

#### `isLoading` *boolean*
> **Default**: `true`
>
> **Modified by**: [`setRows`](#setRows), [`clearRows`](#clearRows)

Can be used to conditionally display a loading indicator. Initially set to `true`.

[`setRows`](#setrows) action sets it to `false`.

[`clearRows`](#clearrows) action sets it to `true`.

#### `pageSize` *number*

> **Default**: `0`
>
> **Modified by**: [`setPageSize`](#setpagesize)

The maximum number of items displayed on a page. If set to 0, pagination is disabled.

#### `currentPage` *number*

>  **Default**: `1`
>
> **Modified by**: [`goToPage`](#gotopage) (including aliases)

The current page index. Has no effect when [`pageSize`](#pagesize-number) is 0.

**Warning**: This number is one-based (the first page has an index of 1 instead of 0). If set to 0, all items are hidden.

### Actions

The action creators are accessible from a `TableActions` instance. The constructor takes the table [namespace](#namespace-string) as a parameter. The dispatched actions have a `namespace` property that contains the namespace that was passed to the constructor.

The action types are static variables of the `TableActions` class.

```javascript
import { TableActions } from "react-select-table";
const todoActions = new TableActions("todo");

//For example to set the table rows you can use
store.dispatch(todoActions.addRow({
    //New row
}))

//You can also access the action types
switch(action.type) {
    case TableActions.ADD_ROW:
        console.log(
            `New row in ${action.table} table`,
            action.payload.newItem
        );
        break;
}
```

For the action types below, the variable name is listed. The actual value is: `TABLE_` + *variable name*. For example the variable `SET_ROWS` would have the value `TABLE_SET_ROWS`.

#### Row actions

#### `setRows`

> **Type**: `SET_ROWS`

Parameters:

* `items` *array of object* OR *object*
* `keyed` *boolean* (false be default)

Set `keyed` to true if the items parameter is of type object and the items are already keyed by value.

Sets item list to `items`. Sets [`isLoading`](#isloading-boolean) state to false.

#### `addRow`

> **Type**: `ADD_ROW`

Parameters:

* `newItem` *object*

Adds `newItem` to the item list.

#### `deleteRows`

> **Type**: `DELETE_ROWS`

Parameters:

* `...values` *parameter array of any*

Deletes all items who's [values][value] are included in `values`.

#### `replaceRow`

> **Type**: `REPLACE_ROW`

Parameters:

* `value` *any*
* `newItem` *object*

Finds the item with [value][value]: `value` and replaces it with `newItem`.

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

#### `clearRows`

> **Type**: `CLEAR_ROWS`

Parameters: none

Removes all items. Sets [`isLoading`](#isloading-boolean) state to true. Clears the selection.

#### Selection actions

#### `selectRow`

> **Type**: `SELECT_ROW`

Parameters:

* `value` *any*
* `ctrlKey` *boolean* (false by default)
* `shiftKey` *boolean* (false by default)

Modifies the selection based on the item that was clicked, and whether the `Ctrl ` or `Shift` keys were held down at the time.

#### `contextMenu`

> **Type**: `CONTEXT_MENU`

Parameters:

* `value` *any*
* `ctrlKey` *boolean*

Modifies the selection based on the item that was right-clicked, and whether the `Ctrl` key was pressed at the time.

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

Finds the item with [value][value]: `value` and selects or deselects it, based on the `selected` parameter.

#### Column actions

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

#### Row display actions

#### `setFilter`

> **Type**: `SET_FILTER`

Parameters:

* `filter` *any*

Sets [`filter`](#filter-any) state to `filter`. Updates the items based on the new filter.

#### `sortBy`

> **Type**: `SORT_BY`

Parameters:

* `path` *string*
* `shiftKey` *boolean* (false by default)

Adds a key to the [`sortBy`](#sortby-object) object with name `path`. If the object does not already contain the key, its value is set to `asc`. Otherwise it is toggled between `asc` and `desc`.

If [`multiSort`](./types.md#multisort-boolean) is set to false or if `shiftKey` is false, all previous sorting columns will be reset.

#### Pagination actions

#### `setPageSize`

> **Type**: `SET_PAGE_SIZE`

Parameters:

* `size` *number*

Sets [`pageSize`](#pagesize-number) state to `size`.  Resets [`currentPage`](#currentpage-number) to 1. Updates the items based on the new page.

#### `goToPage`

> **Type**: `GO_TO_PAGE`
>
> **Aliases:** [`nextPage`](#nextpage), [`previousPage`](#previouspage), [`firstPage`](#firstpage), [`lastPage`](#lastpage)

Parameters:

* `index` *number*

Sets [`currentPage`](#currentpage-number) state to the closest valid page index to `index`. Updates the items based on the new page.

#### `nextPage`

> **Alias of** [`goToPage`](#gotopage)

Parameters: none

Increments `currentPage` by one (when possible).

#### `previousPage`

> **Alias of** [`goToPage`](#gotopage)

Parameters: none

Decrements `currentPage` by one (when possible).

#### `firstPage`

> **Alias of** [`goToPage`](#gotopage)

Parameters: none

Sets `currentPage` to 1.

#### `lastPage`

> **Alias of** [`goToPage`](#gotopage)

Parameters: none

Sets `currentPage` to the largest valid index.

#### Internal actions

In redux devtools, you may notice some other action types, namely `TABLE_SET_COLUMN_COUNT`. These actions are dispatched internally.



### TableCore props

#### `columns` _array of [Column](./types.md#column-object)_

> __Required__
>

The table columns. Don't worry about their order or whether some shouldn't be displayed, those functions can be accomplished by setting [`columnOrder`](#columnorder-array-of-number).

#### `context` *context*

> **Required**

You can import the default redux context using:

```react
import { ReactReduxContext } from "react-redux";
```

Then, you can pass it to the `context` prop. If you are using custom context, you will have to pass that instead.

#### `name` _string_

> __Required__
>

Used for the generation of the react `key` properties for the rows and columns.

Also used for the actions' [`namespace`](#namespace-string) if not explicitly set.

#### `namespace` *string*

> **Optional**

Used to differentiate the [actions](#actions) dispatched by each table.

**Attention**: In most cases, passing the [`name`](#name-string) prop is enough.

If you have two (or more) tables that you want controlling a common reducer, you can set this property to the namespace you passed to [`createTable`](#reducer). Then you can set the table components' `name` props to unique values, but the actions dispatched will be of the same type for all tables sharing the namespace.

#### `className` *string*

> **Optional**

Will be applied to the table element.

#### `emptyPlaceholder` _component_

> **Optional**

Rendered when the table contains no items.

#### Event props

#### `onContextMenu` _function_

> **Optional**

| Parameter | Type           | Description                                                  |
| --------- | -------------- | ------------------------------------------------------------ |
| `values`  | *Array of any* | If [`isListbox`](#islistbox-boolean) is false (default), the [selected values](#selectedvalues-array-of-any).<br/>Otherwise, the [active value](#activevalue-any) in an array |

Called when the user right-clicks on a row or the table container.

#### `onItemsOpen` _function_

> **Optional**

| Name       | Type           | Description                                                 |
| ---------- | -------------- | ----------------------------------------------------------- |
| `values`   | *Array of any* | The [selected values](#selectedvalues-array-of-any)         |
| `enterKey` | *Boolean*      | True if caused by enter key press, false if by double click |

Called when the user double-clicks on a row or presses the enter key. Will not be called if no rows are selected.

#### `onSelectionChange` _function_

> **Optional**

| Parameter | Type           | Description                                         |
| --------- | -------------- | --------------------------------------------------- |
| `values`  | *Array of any* | The [selected values](#selectedvalues-array-of-any) |

Called when the [selection][selection] changes.



### Reducer

To create a reducer, use the `createTable` method.

Parameters:

* `namespace` *string*
* `options` *[Options](./types.md#options-object)* (Optional)
* `initState` *object* (Optional)

The `namespace` parameter must match the component's [`name`](#name-string) or [`namespace`](#namespace-string) prop.

See all available `initState` properties [here](#state).

**Reducer** (ex. `reducer.js`)

```javascript
import { combineReducers } from "redux";
import { createTable } from "react-select-table";

const rootReducer = combineReducers({
    //...Other reducers
    todoTable: createTable("todos", {
        valueProperty: "id",
        isListbox: true,
        path: "todoTable"
    }, {
        pageSize: 10
    })
})

export default rootReducer;
```

**Store** (ex. `store.js`)

In order for events to function, you must apply the `eventMiddleware` to your store.

```javascript
import { createStore, applyMiddleware } from "redux";
import { eventMiddleware } from "react-select-table";
import rootReducer from "./reducer";

export default createStore(rootReducer, applyMiddleware(eventMiddleware));
```

**Component** (ex. `TodoTable.jsx`)

```javascript
import React, { useEffect } from "react";
import { useDispatch, ReactReduxContext } from "react-redux";
import { TableCore, TableActions } from "react-select-table";

const { setItems } = new TableActions("todos");

function TodoTable() {
    const dispatch = useDispatch();

    useEffect(() => {
        // getTodos is an imaginary async method that
        // makes a request to an api and returns an array of todos
        getTodos().then(todos => dispatch(setItems(todos)));
    }, [dispatch]);

    return (
    	<TableCore
            name="todos"
            context={ReactReduxContext}
            columns={[...]}
        />
    )
}


export default TodoTable;
```

**Root component** (ex. `App.js`)

```javascript
import React from "react";
import { Provider } from "react-redux";
import store from "./store";
import TodoTable from "./TodoTable";

function App() {
    return <Provider store={store}>
        <TodoTable />
    </Provider>
}

export default App;
```



### Selectors

The library exports selector factories. Here is an example of how to use them to get the page count (continuing from the reducer example above):

**Using `connect`**

```javascript
import React, { connect } from "react-redux";
import { makeGetPageCount } from "react-select-table";

function App() {
    //... Component body
}

function makeMapState() {
    const getPageCount = makeGetPageCount();

    return state => {
        const todoState = state.todoTable;

        return {
            pageCount: getPageCount(todoState)
        }
    }
}

export default connect(makeMapState)(App);
```

If you are confused with why the `mapStateToProps` method is returning another method, visit the redux documentation section for [factory functions](https://react-redux.js.org/next/api/connect#factory-functions).

**Using hooks**

```javascript
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { makeGetPageCount } from "react-select-table";

function App() {
    const getPageCount = useMemo(makeGetPageCount, []);
    const pageCount = useSelector(s => getPageCount(s.todoTable));

    //... Component body
}

export default App;
```

#### `makeGetPageCount`

Creates a selector that takes the state and returns the page count.



[value]: ./types.md#valueproperty-string
[columnOrder]: #columnorder-array-of-number
[selection]: #selectedvalues-array-of-any
[tableItems]: #tableitems-array-of-object
[columns]: #columns-array-of-column
