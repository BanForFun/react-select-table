## Version 5.3.1
- Clicking on a sortable header for a third time, now disables sorting by that column, even when not holding shift
- Added a third optional 'order' parameter to the sortItems action creator, that takes SortOrders enum values, and can be used to set a specific sort order instead of toggling it
- redux is no longer a peer dependency
- Fixed double click not raising onItemsOpen on chrome
- Added dlMapUtils.getKeyedItems method

## Version 5.3.0
- Added getIsStateNormal and getSelection selectors
- Fixed onSelectionChange event not raised as a result of startLoading and setError actions
- Deprecated eventMiddleware as it is no longer required for any event to work. It was replaced with a noop middleware so that the api doesn't break
- onSelectionChange event fires after onContextMenu
- onSelectionChange event fires on mount

## Version 5.2.7
- Reverted some changes done by version 5.2.6, because it broke apps that used redux-thunk

## Version 5.2.6
- Fixed crash when action is dispatched before table render
- ~~eventMiddleware is no longer required for any event to work. It was replaced with a noop middleware so that the api doesn't break~~
- ~~Added getIsStateNormal and getSelection selectors~~
- ~~Fixed onSelectionChange event not raised as a result of startLoading and setError actions~~

## Version 5.2.5
- Fixed search dialog appearing even when searchProperty was falsy
- Fixed all items being falsely considered search matches when searchPhraseParser returned an empty string

## Version 5.2.4
- Fixed table container having "undefined" class name when not given a custom class
- Added tab navigation
- Sortable table headers can be focused, and while they are, pressing space will toggle the sort order
- Fixed Ctrl + A shortcut only selecting the items from the current page, now it selects the items from all pages
- Home/End keys now set the first/last item active instead of selecting it
- No actions modify their payload anymore
- Added replaceItems action, which does the same thing as setItems but doesn't clear the selection
- Fixed crash when deleting an item with null key

## Version 5.2.3
- Fixed node support

## Version 5.2.2
- Changed build target to node 12

## Version 5.2.1
- By holding control when resizing a column, the next column is also resized so that the sum of their widths stays constant, even for tables with the `constantWidth` option disabled.

## Version 5.2.0
- Added item chunking: Items can be divided into chunks, and the chunks that are not visible are not rendered to improve performance (especially in chrome)
- Added `chunkSize` option to control the size of the chunks
