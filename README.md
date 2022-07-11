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
* ListBox mode (explained below)
* Touch support (chromium based browsers only)
* Events (Selection changed, Columns resized, Items opened, Context menu)
* Modular state saving and restoring (ex. the items can be saved but not the sort order)
* Does not need margin for columns to be resized beyond the visible bounds
* Does not need margin for drag selecting beyond the visible bounds
* Customizable appearance using css variables (sass not required)
* Columns can be hidden by media queries

## Keyboard and mouse shortcuts

### Item selection
* **Up / Down** to select the previous/next item relative to the active item
* **Home / End** to select the first/last item
* **Ctrl + Any of the above** to set as active instead of select
* **Click** to select the item below the cursor
* **Left / Right** to set the row with the same index on the previous/next page active
* **Shift + Any of the above** to select all items in between
* **Shift + Click below rows** to select all items to the end of the page
* **Ctrl + Shift + Any of the above** to add to the previous selection instead of replacing it
* **Double click** to raise an items open event for the selected rows
* **Click below rows** to clear the selection
* **Enter** to select the active row if it's not selected, or to raise an items open event if it is selected
* **Ctrl + Enter** to toggle selection of the active row
* **Ctrl + Click** to toggle selection of the row below the cursor
* **Ctrl + A** to select all items
* **Right click** to raise a context menu event for the selected rows (also changes the selection in the same way a left click does, except if the row under the cursor is already selected)
* **Alt + Right click** to raise a context menu event for an empty selection, but without changing the selection
* **Alt + Ctrl + Right click** to raise a context menu event for the selected rows, without changing the selection
* **Ctrl + Right click below rows** to raise a context menu event for the selected rows, without clearing the selection
* **Shift + Right click** to bring up the browser's context menu
* **Click + Drag** to start drag selecting (you can also scroll while drag selecting)
* **Ctrl + Click + Drag** to add the drag selected rows to the previous selection instead of replacing it

### ListBox mode differences
* **Click below rows** does not clear the selection
* **Right click** to raise a context menu event for the active row (does not change the selection, but sets the row below the cursor active)
* **Right click below rows** to raise a context menu event for an undefined active row, but without clearing the active row
* **Alt + Right click** to raise a context menu event for an undefined active row, but without changing the active row
* **Alt + Ctrl + Right click** to raise a context menu event for the active row, without changing the active row
* **Ctrl + Right click** to raise a context menu event for the selected rows, without changing the selection

### Column resizing
* **Click on the green column separator + Drag** to start resizing the column
* **Move the cursor outside the table while dragging** to start automatically scrolling
* **If the table is overflowing horizontally (aka the scrollbar is visible), scroll with the wheel while dragging** to expand or shrink the column

### Column sorting
* **Click on a header title** to toggle the sorting order for the column between ascending and descending
* **Shift + Click on a header title** to sort the items using this column after first sorting them with the previously selected columns (multiple column sorting)

### Searching
* **Type any character while the table is focused** to bring up the search dialog
* **Up/Down** to go to the previous/next match
* **Press escape** to close the search dialog

## Touch gestures

### Item selection
* **Tap** to select the row below the finger
* **Tap below the rows** to clear the selection
* **Double tap** to raise an items open event for the row below the finger
* **Two-finger tap with both fingers on the same row** to raise a context menu event for the selected rows (also changes the selection in the same way a simple tap does, except if the row is already selected)
* **Two-finger tap with both fingers below the rows** to clear the selection and raise a context menu event for the empty selection
* **Two-finger tap with both fingers on separate rows** to raise an items open event for the selected rows, without changing the selection
* **Long tap** to toggle selection of the row below the finger
* **Long tap + Drag with a second finger** to start drag selecting (you can also scroll with the second finger while drag selecting)

### ListBox mode differences
* **Tap below the rows** does not clear the selection
* **Two-finger tap with both fingers on the same row** to raise a context menu event for the active row (does not change the selection, but sets the row active)
* **Two-finger tap with both fingers below the rows** to raise a context menu event for an undefined active row, but without clearing the active row

### Column resizing
* **Tap on the green column separator + Drag** to start resizing the column
* **Move the finger outside the table while dragging** to start automatically scrolling
* **If the table is overflowing horizontally (aka the scrollbar is visible), scroll horizontally with a second finger anywhere on the table** to expand or shrink the column

### Column sorting
* **Tap on a header title** to toggle the sorting order for the column between ascending and descending
* **Long tap on a header title** to sort the items using this column after first sorting them with the previously selected columns (multiple column sorting)

## Migrating from v4
This version is a complete rewrite, treat it as a completely different library

## Installation

```shell
# Npm
npm install react-select-table

# Yarn
yarn add react-select-table
```
