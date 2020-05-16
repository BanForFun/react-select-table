## Table usage

### Setup

The `initTable`/`disposeTable` (for class components) or `useTable` (for functional components) methods must be called for every table component. You must pass a name as the first parameter. When you render a Table, you must pass the same name to the [`name`](#name-string) component prop.

You can optionally pass an [options](./types.md#options-object) object as a second parameter to either method.

**Functional component**

```javascript
import React from 'react'
import { Table, useTable } from 'react-select-table'

function App() {
    useTable("todos", { valueProperty: "id" });
    
    return (
        <Table name="todos"
            // ...Other props
        />
    )
}
```

**Class component**

```javascript
import React, { Component } from 'react';
import { Table, initTable, disposeTable } from 'react-select-table'

class App extends Component {
    componentDidMount() {
        initTable("todos", { valueProperty: "id" });
    }
    
    componentWillUnmount() {
        disposeTable("todos");
    }

    render() {
        return (
            <Table name="todos"
                // ...Other props
            />
        )
    }
}
```



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