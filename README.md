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
* Multi-column sorting
* Listbox mode
* Pagination
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



## 3.0.0 - Breaking changes

### Common

* Added [`multiSort`](/docs/types.md#multisort-boolean) option

### TableCore

* Renamed `table` to `namespace` in the action payload
* Renamed `reducerName` to [`namespace`](/docs/core.md#namespace-string) in the component props
* `sortPath` and `sortOrder` state properties removed and replaced by [`sortBy`](/docs/core.md#sortby-object)
* When creating a store, you must now apply the [`eventMiddleware`](/docs/core.md#reducer) middleware in order for [events](/docs/core.md#event-props) to function
* You can now dispatch actions in all [event handlers](/docs/core.md#event-props)
* Removed `statePath` component prop. The state path must now be passed in the options as the [`path`](/docs/types.md#path-string) property

### Table

* Removed deprecated `useTable` hook and `initTable`/`disposeTable` functions. Use [`withTable`/`withTables`](/docs/table.md#setup) HOCs instead



## Installation

```shell
#Npm
$ npm install react-select-table

#Yarn
$ yarn add react-select-table
```

In your `App.js` import the stylesheet.

````javascript
import 'react-select-table/dist/index.css';
````



## Examples

### Without redux

[Todo list](https://codesandbox.io/s/rst-simple-wk07o)

[Todo list with pagination](https://codesandbox.io/s/rst-simple-pagination-2trg2)

### With redux

[Todo list with adding and filtering](https://codesandbox.io/s/rst-redux-mrii6)

[Todo list with pagination](https://codesandbox.io/s/rst-redux-pagination-v5ehy)



## Usage

This library contains two components: 

### TableCore

Uses redux for state management. [Go to documentation](/docs/core.md)

### Table

A wrapper for **TableCore** which uses the component parameters to update the redux state internally. Redux is not required for its use but item management becomes your responsibility. [Go to documentation](/docs/table.md)