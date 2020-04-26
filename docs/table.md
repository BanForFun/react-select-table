## Table usage

### Setup

Import the `Table` component and the `configureTableStore` method.

```javascript
import { Table, configureTableStore } from 'react-select-table'
```

The `configureTableStore` method must be called once for every table component. This method returns an object which must be passed to the `Table` component using the `store` prop. You can call it inside `useRef` for functional components or store the return value in a local variable for class components.

Functional component example

```react
import React, { useRef } from "react"

function App() {
    const tableStore = useRef(configureTableStore());
    
    return (
        <Table 
            store={tableStore.current}
            // ...Other props
        />
    )
}
```

Class component example

```react
import React, { Component } from "react";

class App extends Component {
    tableStore = configureTableStore();

    render() {
        return (
            <Table 
                store={tableStore}
                // ...Other props
            />
        )
    }
}
```

### Options

You can optionally pass options as a parameter to the `configureTableStore` method. The options object can have the below properties:

#### `itemParser` _Function_

> **Returns:** *object*
>
> **Default**: `item => item`

| Parameter | Type     | Description          |
| --------- | -------- | -------------------- |
| `item`    | *Object* | Table item to parse. |

Called for each row before adding it to the table. Returns the modified row.

#### `itemPredicate` _Function_

> **Returns**: *boolean*
>
> **Default**: 
>
> ```javascript
> (item, filter) => {
>     if (!filter) return true;
> 
>     for (let key in filter) {
>         if (item[key] !== filter[key])
>             return false;
>     }
> 
>     return true;
> }
> ```

| Parameter | Type     | Description                             |
| --------- | -------- | --------------------------------------- |
| `item`    | *Object* | Table item to filter.                   |
| `filter`  | *Any*    | The [`filter`][#filter-any] prop value. |

Called for each row to decide whether it should be displayed.

Note: The items first pass from the [`itemParser`](#itemparser-function) method.

### Props

#### `store` *Object*

> **Required**

Refer to the [Setup](#setup) section. If not provided, the table will not be rendered.

#### `items` _Array_

> **Required**

The item properties can be anything you want, with the exception of `classNames`. This property can be set to an array of CSS class names which will be applied to the `tr` element.

#### `valueProperty` _String_

> **Required**

Must be set to a path that contains a unique value for each row (ex. `id`). 

#### `minColumnWidth` _Number_

> __Default__: `3`

The minimum column width percentage relative to the table width.

#### `isMultiselect` _Boolean_

> **Default**: `true`

If set to false, the following features are disabled:

* `Shift`+ `Home`/`End`/`Up`/`Down`
* `Ctrl`/`Shift`  + `Click`
* `Ctrl` + `A`
* Drag selection.

#### `isListbox` _Boolean_

> **Default**: `false`

If set to true:

* Clicking on empty space below the items won't clear the selection.
* Right clicking won't select the row below the cursor, it will just be set to active.
* The active value will be passed to [`onContextMenu`](./common.md#oncontextmenu-function) instead of the selected values.
* Drag selection is disabled.

#### `filter` _Any_

> **Default**: `null`

This object is passed as the second parameter to [`itemPredicate`](#itempredicate-function).

__With the default implementation__, this object can contain key-value pairs of property paths and matching values. For example:

```javascript
{
    id: "1",
    title: "react-select-table",
    author: "BanForFun"
}
```

The above filter will only allow rows that have a `title` property set to `"react-select-table"` and an `author` property set to `"BanForFun"`. Any extra properties will be ignored (Like `id` in this instance).