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

## 1.0.0 - Breaking changes

* Table:  `useTable` parameters changed, `store` prop no longer required. See [setup](/docs/table.md#setup) section for details.

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

1. `TableCore` which uses redux for state management.<br/>[TableCore documentation](/docs/core.md)
2. `Table` which is a wrapper for `TableCore` and uses the component parameters to update the redux state internally. Redux is not required for its use but item management becomes your responsibility.<br/>[Table documentation](/docs/table.md)
