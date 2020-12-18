# react-select-table

**Disclaimer: This component can only be controlled using redux**

## Features

* Item filtering
* Single and multi-column sorting
* Item pagination
* Resizable columns
* Sticky header
* Drag selection with automatic scrolling
* Selection behavior emulating windows ListView
* Fully usable with only the keyboard
* Percentage based column sizing (can be used in resizable containers)
* Single and multi selection
* ListBox mode
* Touch support (chrome only)
* Events

### Shortcuts

* **Shift** + **Click** to select range
* **Shift** + **Up** / **Down** / **Home** / **End** to expand or shrink selection
* **Ctrl** + **Up** /  **Down** / **Home** / **End** to set the active row
* **Ctrl** + **Click** / **Enter** to toggle selection of the active row
* **Up** / **Down** to select the previous/next item relative to the active row
* **Ctrl** + **A** to select all items
* **Home** / **End** to select the first/last item

### Browser compatibility

Note: This package is primarily designed for electron apps. Compatibility and performance with non chromium-based browsers is not guaranteed. Development is done with Brave on Linux, and Chrome on Android.

Known problems:

* Chromium based browsers: Having the developer tools open, makes drag-selection unusably laggy

  Hack: [Hide the drag selection rectangle](./docs/component.md#showselectionrect-bool) in development environment

* Firefox desktop: Drag-selection performance not as good as chromium

* Firefox mobile: Drag-selection doesn't work at all



## Version 5.0.0

### [Developer changes](./docs/changes.md)

This time I tried my hardest to fix all the problems, so fingers-crossed, this is the last major release.

### End user changes

* Drag selection big performance increase
* Drag-selecting while holding **Ctrl** doesn't deselect the already selected items
* Using the table with only the keyboard is now entirely possible
* Fixed automatic scrolling when navigating with the keyboard
* Added multi selection touch support (pressing and holding acts like **Ctrl** + **Click**)



## Installation

```shell
# Npm
npm install react-select-table

# Yarn
yarn add react-select-table
```



## Introduction

You will see the term 'value' referenced many times. The table rows are given in an array of objects, in which every object must have a property with a unique value (that would be `_id` when using MongoDB for example). That value is considered the item's value.

Demos:

* [Todo list with item addition and filtering](https://codesandbox.io/s/tablecore-v4-todos-99eue)
* [Todo list with pagination](https://codesandbox.io/s/tablecore-v4-pagination-ozgqt)

