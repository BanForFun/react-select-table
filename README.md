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

Say for example that we want to render the items below:

```javascript
[
    {
        pet_id: 1,
        photo_url: "",
        name: "",
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

```react
{
	title: "Birth date",
	path: "birth_date",
	render: date => new Date(date).toLocaleDateString()
}
```

Columns that have a `path` property are sortable by default. To avoid this, we can use the `key` property instead.

__Warning__: If `path` is not provided, the `render` method is called with the single parameter being the whole item.

```react
{
    title: "Photo",
    key: "photo",
    render: pet => <img src={pet.photo_url} alt="Photo" />
/>
```

#### `name` _String_

Used for the generation of the react `key` properties for the rows and columns.

#### `emptyPlaceholder` _Component_

Rendered when the table contains no items.

#### `onContextMenu(values)` _Function_

`values`: The rows that the context menu affects.

#### `onItemsOpen(values, enterKey)` _Function_

Called when the user double-clicks or presses `Enter`.

`values`: The array of selected values

`enterKey`: True if caused by `Enter` key press, false if caused by double click.

#### `onSelectionChange(values)` _Function_

`values`: The new selected values

### Table API

Import the `Table` component.

```javascript
import { Table } from 'react-select-table'
```

#### `items` _Array_

The item properties can be anything you want, with the exception of `classNames`. This property can be set to an array of CSS class names which will be applied to the `tr` element.

