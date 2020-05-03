## Table usage

### Setup

The `configureTableStore` (for class components) or `useTableStore` (for functional components) method must be called once for every table component. These methods return an object which must be passed to the `Table` component using the `store` prop. 

You can optionally pass an [options](./core.md#options-object) object as a parameter to either method.

**Functional component**

```react
import React from 'react'
import { Table, useTableStore } from 'react-select-table'

function App() {
    const tableStore = useTableStore();
    
    return (
        <Table 
            store={tableStore}
            // ...Other props
        />
    )
}
```

**Class component**

```react
import React, { Component } from 'react';
import { Table, configureTableStore } from 'react-select-table'

class App extends Component {
    tableStore = configureTableStore();

    render() {
        return (
            <Table 
                store={this.tableStore}
                // ...Other props
            />
        )
    }
}
```

### Props

#### `store` *object*

> **Required**

Refer to the [setup](#setup) section. If not provided, the table will not be rendered.

#### `items` _array of object_

> **Required**
>
> **Action**: [`setRows`](./core.md#setrows)

The items' properties can be anything you want, with the exception of `classNames`. This property can be set to an array of CSS class name strings which will be applied to the `tr` element.

#### [`columns`](./core.md#columns-array-of-column) _array of [Column](./core.md#column-object)_
> **Required**

#### [`name`](./core.md#name-string) _string_
> **Required**

#### `valueProperty` _string_

> **Required**
>
> **Action**: [`setValueProperty`](./core.md#setvalueproperty)

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

#### `minColumnWidth` *number*

> **Default**: `3`
>
> **Action**: [`setMinColumnWidth`](./core.md#setmincolumnwidth)

#### `isMultiselect` *boolean*

> **Default**: `true`
>
> **Action**: [`setMultiselect`](./core.md#setmultiselect)

#### `isListbox` *boolean*

> **Default**: `false`
>
> **Action**: [`setListboxMode`](./core.md#setlistboxmode)

#### `filter` *any*

> **Default**: `null`
>
> **Action**: [`setFilter`](./core.md#setfilter)
