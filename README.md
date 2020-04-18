# react-select-table

> React ListView component with (drag) selection and keyboard shortcut support.

## Features

* Item parsing, filtering and sorting
* Resizable columns
* Sticky header
* Row drag selection
* Keyboard shortcut support (`Shift` + `Click` to select range etc.)
* Redux and parameter api
* Row deselection when table container is clicked
* Selection change event

## Installation

```shell
$ npm install react-select-table
```

In your `App.js` import the stylesheet.

````javascript
import 'react-select-table/dist/index.css';
````

## Usage

This library contains two components: 

1. `TableCore` which uses redux for state management
2. `Table` which is a wrapper for `TableCore` and uses the component parameters to update the redux state internally. Redux is not required for its use but item management becomes your responsibility.

### Common API

#### `columns` _Array_

> __Required__

Say for example that we want to render the items below:

```javascript
[
    {
        pet_id: 1,
        photo_url: "https://www.petsdb.gr/files/assets/images/lefki.jpg",
        name: "Lefki", 
        birth_date: "2019-04-03"
    }
]
```

For displaying text, the column object should include the following properties. The property value at `path` is resolved and rendered. The `title` string is displayed on the header.

```javascript
{
    title: "Name",
    path: "name"
}
```

We can set the `isHeader` property to true, so that a `th` element is used instead of `td`.

```javascript
{
	title: "Id",
	path: "pet_id",
	isHeader: true
}
```

To render custom content, we can use the `render` property. In this example we use it to format a date string.

The `render` method is called with two parameters: 

1. The item's property value at `path`  
2. The whole item

It can return either a component or (in this case) a string.

```javascript
{
	title: "Birth date",
	path: "birth_date",
	render: date => new Date(date).toLocaleDateString()
}
```

Columns that have a `path` property are sortable by default. To avoid this, we can use the `key` property instead.

__Warning__: If `path` is not provided, the `render` method is called with the single parameter being the whole item.

```javascript
{
    title: "Photo",
    key: "photo",
    render: pet => <img src={pet.photo_url} alt="Photo" />
}
```

#### `name` _String_

> __Required__

Used for the generation of the react `key` properties for the rows and columns.

#### `emptyPlaceholder` _Component_

> **Default**: `null`

Rendered when the table contains no items.

#### `onContextMenu(values)` _Function_

> **Default**: `() => {}`

Called when the user right-clicks on a row or the table container.

| Parameter | Type    | Description                                                  |
| --------- | ------- | ------------------------------------------------------------ |
| `values`  | *Array* | If `isListbox` is false (default), the selected values. Otherwise, the active value. |

#### `onItemsOpen(values, enterKey)` _Function_

> **Default**: `() => {}`

Called when the user double-clicks or presses the enter key.

| Parameter  | Type      | Description                                                  |
| ---------- | --------- | ------------------------------------------------------------ |
| `values`   | *Array*   | The selected values.                                         |
| `enterKey` | *Boolean* | True if caused by enter key press, false if caused by double click. |

#### `onSelectionChange(values)` _Function_

> **Default**: `() => {}`

Called when the selection changes.

| Parameter | Type    | Description          |
| --------- | ------- | -------------------- |
| `values`  | *Array* | The selected values. |

### Table API

Import the `Table` component.

```javascript
import { Table } from 'react-select-table'
```

#### `items` _Array_

> **Required**

The item properties can be anything you want, with the exception of `classNames`. This property can be set to an array of CSS class names which will be applied to the `tr` element.

#### `valueProperty` _String_

> **Required**

Must be set to a path that contains a unique value for each row. 

Warning: The value at the provided path is interpreted as a string. Unexpected behavior will occur if two values that are equal when converted to string are present at the same time, for example: `1` and `"1"`.

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
* Right clicking won't select the row below the cursor.
* The active value will be passed to `onContextMenu` instead of the selected values.
* Drag selection is disabled.

#### `itemParser(row)` _Function_

> **Returns:** *object*
>
> **Default**: `row => row`

Called for each row before adding it to the table. Must return the modified row.

#### `itemPredicate(row, filter)` _Function_

> **Returns**: *boolean*
>
> **Default**: 
>
> ```javascript
> (row, filter) => {
> 	for (let key in filter) {
>          if (row[key] !== filter[key])
>              return false;
>      }
> 
>      return true;
> }
> ```

Called for each row to decide whether it should be displayed. Must return a boolean.

Note: The rows will first pass from the `itemParser` method.

#### `filter` _Object_

> **Default**: `{}`

This object is passed as the first parameter to the `itemPredicate` method.

__With the default implementation__ of `itemPredicate`, this object can contain key-value pairs of property paths and matching values. For example:

```javascript
{
    id: "1",
    title: "react-select-table",
    author: "BanForFun"
}
```

The above filter will only allow rows that have a `title` property set to `"react-select-table"` and an `author` property set to `"BanForFun"`. Any extra properties will be ignored (Like `id` in this instance).
