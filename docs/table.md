## Table usage

### Setup HOC

The easier of the two methods. Recommended if you only render one table in your component. 

The `withTable` function, takes two parameters:

1. The table name (think of it as an id, which must be unique for each table)
2.  An [options](./types.md#options-object) object **(Optional)**

... and returns a function to which you must pass your component (as shown below).

```javascript
import React from 'react'
import { Table, withTable } from 'react-select-table'

function App() {
    
    return <Table 
    	// ...props
    />
}
    
export default withTable("todos", { valueProperty: "id" })(App);
```

The hoc will pass these props to your component:

* `pageCount` *Number*: The number of pages after item filtering. See [`pageSize` prop](#pagesize-number) for details.

**Warning**: The props passed by the hoc, will override props with the same name.



### Props

#### `items` _array of object_

> **Required**

The complete set of items, before parsing, sorting or filtering.

If an item has a `className` property set to an array of CSS class name strings, they will be applied to the `tr` element.

#### `columns` _array of [Column](./types.md#column-object)_
> **Required**

The table columns.

#### `name` _string_
> **Required**

The table name. Used for the generation of the react keys. The `initTable` or `useTable` method must be called first with the same name, as shown in the [setup](#setup) section.

#### `className` _string_

> **Default:** `""`

Will be applied to the table element.

#### `emptyPlaceholder` _component_

> **Default**: `null`

Rendered when the table contains no items.

#### `filter` *any*

> **Default**: `null`

Passed as the second parameter to [`itemPredicate`](./types.md#itempredicate-function). [Example usage](./core.md#filter-any)

#### `pageSize` *number*

> **Default**: `0`

If set to an integer larger than 0, the table items will be divided into pages with a maximum of `pageSize` items.

#### `page` *number*

> **Default**: `1`

Sets the current page. Has no effect if [`pageSize`](#pagesize-number) is set to 0.

### Event props

#### `onContextMenu` _function_

>  **Default**: `() => {}`

Called when the user right-clicks on a row or the table container. [See parameters](./core.md#oncontextmenu-function)

#### `onItemsOpen` _function_

> **Default**: `() => {}`

Called when the user double-clicks on a row or presses the enter key. Will not be called if no rows are selected. [See parameters](./core.md#onitemsopen-function)

#### `onSelectionChange` _function_

> **Default**: `() => {}`

Called when the selection changes. [See parameters](./core.md#onselectionchange-function)