# react-select-table

**Disclaimer: This component can only be controlled using redux**

## Features

* Item filtering
* Multi-column sorting
* Item pagination
* Resizable columns (widths can be saved and restored)
* Sticky header
* Performance optimized drag selection with automatic scrolling (even with uneven in height rows)
* Selection behavior emulating native windows ListView (with some improvements)
* Fully usable with only the keyboard
* Percentage based column sizing (can be used in resizable containers)
* Single and multi-row selection
* ListBox mode (context menu gesture and clicking below the rows does not modify the selection)
* Touch support (chromium based browsers only)
* Events (Selection changed, Columns resized, Items opened, Context menu)
* Modular state saving and restoring (ex. the items can be saved but not the sort order)
* Does not need margin for columns to be resized beyond the visible bounds
* Does not need margin for drag selecting beyond the visible bounds
* Master and slave tables for showing different columns on desktop and mobile
* Customizable theme system
* Fully documented with JSDoc

### Keyboard and mouse shortcuts
* **Up / Down** to select the previous/next item relative to the active item
* **Home / End** to select the first/last item
* **Ctrl + Any of the above** to set as active instead of select
* **Click** to select the item below the cursor
* **Left / Right** to set the row with the same index on the previous/next page active
* **Shift + Any of the above** to select all items in between
* **Shift + Click below rows** to select all items to the end of the page
* **Ctrl + Shift + Any of the above** to add to the previous selection instead of replacing it
* **Double click** to raise an items open event
* **Click below rows** to clear the selection
* **Enter** to select the active row if it's not selected, or to raise an items open event if it is selected
* **Ctrl + Enter** to toggle selection of the active row
* **Ctrl + Click** to toggle selection of the row below the cursor
* **Ctrl + A** to select all items
* **Right click** to raise a context menu event (Right click also modifies the selection in the same way a left click does, except if the row under the cursor is already selected)
* **Shift + Right click** to bring up the browser's context menu
* **Alt + Right click** to raise a context menu event emulating an empty selection, but without actually modifying the selection
* **Alt + Ctrl + Right click** to raise a context menu event without modifying the selection
* **Ctrl + Right click below rows** to raise a context menu event without clearing the selection


### Touch gestures


## Migrating from v4.x.x

This version is a complete rewrite, treat it as a completely different library





## Installation

```shell
# Npm
npm install react-select-table

# Yarn
yarn add react-select-table
```



## Introduction

You will see the term 'value' referenced many times. The table rows are given in an array of objects, in which every object must have a property with a unique value (that would be `_id` when using MongoDB for example). That value is considered the item's value.
