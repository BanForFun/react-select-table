# Options

#### `context` *Context*

> **Required**

The react-redux context for your store. You can import the default one using:

```javascript
import { ReactReduxContext } from "react-redux"
```

#### `valueProperty` *string*

> Default: `'id'`

Property path that contains a unique value for each item. The path is resolved using the lodash `get` method.

#### `scrollX` *boolean*

> Default: `false`

If set to true:

* Columns are allowed to overflow the container horizontally
* A column resizer will be added to the last column

#### `multiSelect` *boolean*

> Default: `true`

If set to false:

* **Ctrl** / **Shift** + **Click** / **Home** / **End** / **Up** / **Down** are disabled
* **Ctrl** + **A** is disabled
* Drag selection is disabled

#### `listBox` *boolean*

> Default: `false`

If set to true:

* Clicking on the empty space below the items won't clear the selection
* Right clicking a row won't select it, it will just be set to active

#### `multiSort` *boolean*

>  Default: `false`

If set to true: The user is allowed to shift-click on the headers to sort the items by multiple columns

#### `minColumnWidth` *number*

> Default: `3`

The minimum column width percentage relative to the table width

#### `path` *string*

> Default: `null`

If the table reducer isn't the root, you can set the path where the table reducer is located. The path is resolved using the lodash `get` method.

#### `initState` *object*

> Default: `{}`

The initial redux state. The available properties and their default values can be found [here][state]

#### `itemParser` _function_

> Default: 
>
> ```javascript
> item => item
> ```

Called for each item before adding it to the table

Arguments:

1. *object*

   The item to parse

Returns: *object*

Must return a new object. Do NOT mutate the argument

#### `itemPredicate` _function_

> Default:
>
> ```javascript
>(item, filter) => filter ? _.isMatch(item, filter) : true
> ```

Called for each item to decide whether it should be displayed

Arguments:

1. *object*

   The [parsed][parser] item to filter

2. *any*

   The [item filter][filter]

Returns: *boolean*



## Customize default options





[setDefaultOptions]: ./utils.md#setdefaultoptions



[state]: ./state.md
[filter]: ./state.md#filter-any


[parser]: #itemparser-function