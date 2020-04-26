# react-select-table

> React ListView component with (drag) selection and keyboard shortcut support.

## Features

* Item parsing, filtering and sorting
* Resizable columns
* Sticky header
* Row drag selection
* Keyboard shortcut support (`Shift` + `Click` to select range etc.)
* Redux and parameter API
* Row deselection when table container is clicked
* Optional redux item management

## 0.1.0 - Breaking changes

* Table: New required prop. See [setup](/docs/table.md#setup) section for details.
* Table: `itemParser` and `itemPredicate` now constant. See [options](/docs/table.md#options) section for new usage.

I'm sorry but expect more breaking changes while the project is in beta. Feedback is welcome.

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

More examples coming soon.

## Usage

This library contains two components: 

1. `TableCore` which uses redux for state management.
2. `Table` which is a wrapper for `TableCore` and uses the component parameters to update the redux state internally. Redux is not required for its use but item management becomes your responsibility.

[Common documentation for `Table` and `TableCore`](/docs/common.md)

[`Table` specific documentation](/docs/table.md)

[`TableCore` specific documentation](/docs/tableCore.md)