# Options

### `context` *Context*

**Required**

The react-redux context for your store. You can import the default one using:

```javascript
import { ReactReduxContext } from "react-redux"
```

### `valueProperty` *string*

**Default:** `'id'`

Property path that contains a unique value for each item. The path is resolved using lodash's [`get`][get] method.

### `scrollX` *boolean*

**Default:** `false`

If set to true:

* Columns are allowed to overflow the container horizontally
* A column resizer will be added to the last column

### `multiSelect` *boolean*

**Default:** `true`

If set to false:

* **Ctrl** / **Shift** + **Click** / **Home** / **End** / **Up** / **Down** are disabled
* **Ctrl** + **A** is disabled
* Drag selection is disabled

### `listBox` *boolean*

**Default:** `false`

If set to true:

* Clicking on the empty space below the items won't clear the selection
* Right clicking a row won't select it, it will just become active

### `multiSort` *boolean*

**Default:** `false`

If set to true: 

* Shift-clicking on multiple headers will sort the items by multiple columns

### `minColumnWidth` *number*

**Default:** `3`

The minimum column width percentage relative to the table width.

### `path` *string*

**Default:** `null`

If the table reducer isn't the root, you can set the path where the table reducer is located. The path is resolved using lodash's [`get`][get] method.

### `initState` *object*

**Default:** `{}`

The initial redux state. See all available properties and their default values [here](./state.md).

### `itemParser` _function_

**Default:** `item => item`

Called for each item before adding it to the table.

Arguments:

1. The item to parse

Must return a new item object. Do NOT mutate the argument

### `itemPredicate` _function_

**Default:**  Lodash's [`isMatch`](https://lodash.com/docs/4.17.15#isMatch) method

Called for each item to decide whether it will be shown.

Will only be called if [filter][] is truthy, otherwise all items will be shown.

Arguments:

1. The [parsed][parser] item to filter

2. The [item filter][filter]

Must return true for the item to be shown, and false for it to be hidden.



[get]: https://lodash.com/docs/4.17.15#get



[parser]: #itemparser-function



[filter]: ./state.md#filter-any
