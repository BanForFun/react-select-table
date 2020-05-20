# react-select-table

> React ListView component with drag selection and keyboard shortcut support.

## Features

* Item parsing, filtering and sorting
* Resizable columns
* Sticky header
* Mouse drag selection with automatic scrolling
* [Keyboard shortcut support](#shortcuts)
* Controlled from parameters or optionally redux
* Row deselection when table container is clicked
* Optional redux item management
* Listbox mode
* Touch support

### Shortcuts

* `Shift`+`Click` to select range
* `Shift`+`Up`/`Down` to expand/shrink selection
* `Shift`+`Home`/`End` to select range to the first/last item
* `Ctrl`+`Click` to toggle item selection
* `Up`/`Down` to select the previous/next item
* `Ctrl`+`A` to select all items
* `Home` to select the first item
* `End` to select the last item

## 2.0.0 - Breaking changes

### TableCore

* Action types are now **static** and the table name is given in the action's `table` property. [More details](/docs/core.md#actions)
* Actions now have a `payload` property. The payload is no longer spread inside the action.
* [`createTable`](./docs/core.md#reducer) parameters: Swapped position of `initState` and `options`.
* State properties `isMultiselect`, `isListbox`, `minColumnWidth` and `valueProperty` are now constant and must be specified in the `options` (second) parameter of [`createTable`](./docs/core.md#reducer).
* Removed `setMultiselect`, `setListboxMode`, `setMinColumnWidth` and `setValueProperty` actions.

### Table

* Component props `isMultiselect`, `isListbox`, `minColumnWidth` and `valueProperty` removed. These properties are now constant and must be specified in the `options` (second) parameter of [`initTable` or `useTable`](./docs/table.md#setup).

## Installation

```shell
$ npm install react-select-table
```

In your `App.js` import the stylesheet.

````javascript
import 'react-select-table/dist/index.css';
````

## Examples

[Simple todo example](https://codesandbox.io/s/rst-simple-wk07o)

[Redux todo example](https://codesandbox.io/s/rst-redux-mrii6)

More examples coming soon

## Usage

This library contains two components: 

### TableCore

Uses redux for state management. [Go to documentation](/docs/core.md)

### Table

A wrapper for **TableCore** which uses the component parameters to update the redux state internally. Redux is not required for its use but item management becomes your responsibility. [Go to documentation](/docs/table.md)