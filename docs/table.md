## Table usage

### Setup

#### One table

The `withTable` function, takes two parameters:

1. The table name (think of it as an id, which must be unique for each table)
2.  An [options object][options] **(Optional)**

... and returns a function to which you must pass your component (as shown below).

```javascript
import React from 'react'
import { Table, withTable } from 'react-select-table'

function App() {  
    return <Table columns={...} items={...} />
}
    
export default withTable("todos", { valueProperty: "id" })(App);
```

The HOC will pass these props to your component:

* `pageCount` *Number*: The number of pages after item filtering. See [`pageSize` prop](#pagesize-number) for details.

**Warning**: The props passed by the HOC, will override props with the same name.

#### Multiple tables

The `withTables` (note the plural) function takes one parameter: an object whose keys are table names and values are [options objects][options].

It returns a function to which you must pass your component (as shown below).

Note that you must pass the [`name`](#name-string) prop to the `Table` components, matching to object keys in the `withTables` parameter (as shown below).

```javascript
import React from 'react'
import { Table, withTables } from 'react-select-table'

function App() {
    return <div>
        <Table name="users" 
    		columns={...} 
            items={...} />
                
        <Table name="todos" 
    		columns={...} 
            items={...} />
    <div/>
}

export default withTables({
    users: { valueProperty: "userId" },
    todos: { valueProperty: "todoId", isMultiselect: false }
})(App)
```

The HOC will pass a prop for every table (named after the table) to your component, which will be an object containing these properties:

* `pageCount` *Number*: The number of pages after item filtering. See [`pageSize` prop](#pagesize-number) for details.

**Warning**: The props passed by the HOC, will override props with the same name.



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

The table name. Used for the generation of the react keys.

If the `withTable` HOC was used, you needn't pass this prop as it will be automatically passed through context.

#### `className` _string_

> **Optional**

Will be applied to the table element.

#### `emptyPlaceholder` _component_

> **Optional**

Rendered when the table contains no items.

#### `filter` *any*

> **Optional**

Passed as the second parameter to [`itemPredicate`](./types.md#itempredicate-function). [Example usage](./core.md#filter-any)

#### `pageSize` *number*

> **Optional**

If set to an integer larger than 0, the table items will be divided into pages with a maximum of `pageSize` items.

#### `page` *number*

> **Optional**

Sets the current page. Has no effect if [`pageSize`](#pagesize-number) is set to 0.

### Event props

#### `onContextMenu` _function_

>  **Optional**

Called when the user right-clicks on a row or the table container. [See parameters](./core.md#oncontextmenu-function)

#### `onItemsOpen` _function_

> **Optional**

Called when the user double-clicks on a row or presses the enter key. Will not be called if no rows are selected. [See parameters](./core.md#onitemsopen-function)

#### `onSelectionChange` _function_

> **Optional**

Called when the selection changes. [See parameters](./core.md#onselectionchange-function)



[options]: ./types.md#options-object