## Table usage

### Setup

The `initTable`/`disposeTable` (for class components) or `useTable` (for functional components) methods must be called for every table component. You must pass a name as the first parameter. The name passed to the method must match the component's `name` prop.

You can optionally pass an [options](./core.md#options-object) object as a second parameter to either method.

**Functional component**

```react
import React from 'react'
import { Table, useTable } from 'react-select-table'

function App() {
    useTable("todos");
    
    return (
        <Table name="todos"
            // ...Other props
        />
    )
}
```

**Class component**

```react
import React, { Component } from 'react';
import { Table, initTable, disposeTable } from 'react-select-table'

class App extends Component {
    componentDidMount() {
        initTable("todos");
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

If an item has a `className` property set to an array of CSS class name strings, they will be applied to the `tr` element.

#### [`columns`](./core.md#columns-array-of-column) _array of [Column](./core.md#column-object)_
> **Required**

#### [`name`](./core.md#name-string) _string_
> **Required**

#### [`valueProperty`](./core.md#valueproperty-string) _string_

> **Required**

#### [`className`](./core.md#classname-string) _string_

> **Default:** `""`

#### [`emptyPlaceholder`](./core.md#emptyplaceholder-component) _component_

> **Default**: `null`

#### [`onContextMenu`](./core.md#oncontextmenu-function) _function_

>  **Default**: `() => {}`

#### [`onItemsOpen`](./core.md#onitemsopen-function) _function_

> **Default**: `() => {}`

#### [`onSelectionChange`](./core.md#onselectionchange-function) _function_

> **Default**: `() => {}`

#### [`minColumnWidth`](./core.md#mincolumnwidth-number) *number*

> **Default**: `3`

#### [`isMultiselect`](./core.md#ismultiselect-boolean) *boolean*

> **Default**: `true`

#### [`isListbox`](./core.md#islistbox-boolean) *boolean*

> **Default**: `false`

#### [`filter`](./core.md#filter-any) *any*

> **Default**: `null`
