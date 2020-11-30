# react-select-table

## Features

* Item parsing
* Item filtering
* Item sorting
* Item pagination
* Re-sizable columns
* Sticky header
* Drag selection with automatic scrolling
* Windows ListView-like selection behavior
* Single and multi column sorting modes
* Single and multi selection modes
* ListBox mode
* Touch support (chrome only)
* Optionally controlled with redux

### Shortcuts

* `Shift`+`Click` to select range
* `Shift`+`Up`/`Down` to expand/shrink selection
* `Ctrl`+`Click`/`Enter` to toggle selection of the active item
* `Ctrl`+`Up`/`Down` to set the active item
* `Up`/`Down` to select the only previous/next item
* `Ctrl`+`A` to select all items
* `Home` to select the first item
* `End` to select the last item



## Version 5.0.0

### [Developer changes](./docs/changes.md)

### End user changes

* Drag selection big performance increase
* Drag-selecting while holding `Shift` doesn't deselect the already selected items
* Using the table with only the keyboard is now entirely possible
* Fixed automatic scrolling when navigating with the keyboard



## Installation

```shell
# Npm
npm install react-select-table

# Yarn
yarn add react-select-table
```

In your `App.js` or equivalent import the stylesheet

````javascript
import 'react-select-table/dist/index.css';
````



## Introduction

You will see the term 'value' referenced many times. The table rows are given in an array of objects, in which every object must have a property with a unique value (that would be `_id` when using MongoDB for example). That unique value is considered the item's value



## Components

This library contains two components: 

### TableCore

Controlled with redux

Examples:

* [Todo list with item addition and filtering](https://codesandbox.io/s/tablecore-v4-todos-99eue)
* [Todo list with pagination](https://codesandbox.io/s/tablecore-v4-pagination-ozgqt)

**[Documentation](/docs/core.md)**

### Table

A wrapper for `TableCore` which uses component props to update the redux state internally. Many features are missing compared to `TableCore`, but it is easier to implement

Examples: 

* [Todo list with horizontal scrolling](https://codesandbox.io/s/table-v4-simple-pqtos)
* [Todo list with pagination](https://codesandbox.io/s/table-v4-pagination-r8vw1)

**[Documentation](/docs/table.md)**