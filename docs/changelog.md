## Version 5.2.2
- Changed build target to node 12

## Version 5.2.1
- By holding control when resizing a column, the next column is also resized so that the sum of their widths stays constant, even for tables with the `constantWidth` option disabled.

## Version 5.2.0
- Added item chunking: Items can be divided into chunks, and the chunks that are not visible are not rendered to improve performance (especially in chrome)
- Added `chunkSize` option to control the size of the chunks
