## Table usage

### Setup

The `withTables` HOC, takes two parameters:

1. Your component
2. An object whose keys are table names, and values are [option objects][options]

```javascript
import React from 'react'
import { Table, withTable } from 'react-select-table'

const items = [...]
const columns = [...]

function App() {  
    return <Table name="todos" 
                  columns={columns} 
                  items={items} />
}
    
export default withTables(App, {
   todos: { valueProperty: "id" }
});
```



### `useTable` hook

You can also optionally use the `useTable` hook, which takes the table name as a parameter and returns an object with the following properties:

#### `pageCount` *number*

The number of pages based on the [items][items] and [page size][pageSize].

#### `tableItems` *array of objects*

The items after parsing, sorting and filtering. Can be used for example to display a grid instead of the table on mobile.

#### `selectedValues` *array of any*

The selected values

#### `tableProps` *object*

This object contains props which must be passed to the Table component like shown below

```javascript
import React from 'react'
import { Table, withTable, useTable } from 'react-select-table'

const items = [...]
const columns = [...]

function App() {
    const { tableProps } = useTable("todos");
    
    return <Table columns={columns} 
                  items={items}
                  {...tableProps} />
}
    
export default withTables(App, {
   todos: { valueProperty: "id" }
});
```



### Table props

**All [common props][commonProps] plus:**

#### `items` _object [ ]_

> Required

Dispatches [`setRows`][setRows] when updated.

#### `filter` *any*

Dispatches [`setFilter`][setFilter] when updated.

#### `pageSize` *number*

Dispatches [`setPageSize`][setPageSize] when updated.

#### `page` *number*

Dispatches [`goToPage`][goToPage] when updated.



[options]: ./options.md



[commonProps]: ./common.md#component-props



[setRows]: ./actions.md#setRows
[setFilter]: ./actions.md#setFilter
[setPageSize]: ./actions.md#setPageSize
[goToPage]: ./actions.md#goToPage



[ items ]: #items-array-of-object
[pageSize]: #pagesize-number