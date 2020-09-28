# react-select-table

> React ListView component with drag selection and keyboard shortcut support.

## Features

* Item parsing
* Item filtering
* Item sorting
* Item pagination
* Resizable columns
* Sticky header
* Drag selection with automatic scrolling
* [Keyboard shortcut support](#shortcuts)
* Keyboard and mouse selection
* (Multi) column sorting
* Listbox mode
* Touch support (chrome only)

### Shortcuts

* `Shift`+`Click` to select range
* `Shift`+`Up`/`Down` to expand/shrink selection
* `Shift`+`Home`/`End` to select range to the first/last item
* `Ctrl`+`Click` to toggle item selection
* `Up`/`Down` to select the previous/next item
* `Ctrl`+`A` to select all items
* `Home` to select the first item
* `End` to select the last item



# [4.0.0 Breaking changes](/docs/changes.md)



## Installation

```shell
# Npm
$ npm install react-select-table

# Yarn
$ yarn add react-select-table
```

In your `App.js` import the stylesheet

````javascript
import 'react-select-table/dist/index.css';
````



## Examples

### Without redux

[Todo list with horizontal scrolling](https://codesandbox.io/s/table-v4-simple-pqtos)

[Todo list with pagination](https://codesandbox.io/s/table-v4-pagination-r8vw1)

### With redux

[Todo list with item addition and filtering](https://codesandbox.io/s/tablecore-v4-todos-99eue)

[Todo list with pagination](https://codesandbox.io/s/tablecore-v4-pagination-ozgqt)



## Before you read

You will see the term 'value' referenced many times. The table rows are objects in an array, in which every object must have a property with a unique value (that would be '_id' when using MongoDB). That unique value is considered the item's value.

JavaScript types are written in *italic*

HTML elements are written in **bold**



## Usage

This library contains two components: 

### TableCore

Controlled with redux. [TableCore documentation](/docs/core.md)

### Table

A wrapper for `TableCore` which uses component props to update the redux state internally. Many features are missing compared to `TableCore`. [Table documentation](/docs/table.md)