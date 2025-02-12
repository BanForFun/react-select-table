# Infinite scrolling behavior

## Axioms

- Server uses stable sort
- Server keeps list version code

## Operation order

| While running | Comes command | Action                                     |
| ------------- | ------------- | ------------------------------------------ |
| Add/Remove    | Load          | Error                                      |
| Load          | Load          | Error                                      |
| Add/Remove    | Add/Remove    | Queue                                      |
| Load          | Add/Remove    | Execute immediately, ignore result of load |

## Operations

### Load more

- Client sends *list version*, *last loaded index* and *last visible index*
- Server checks the client's list version
  - If current, responds with items from *last loaded index* to *last visible index* (if range non-negative)
  - If newer, responds with items from beginning to *last visible index*
  - Always includes list version in response
- Client replaces items with received and updates list version
  - Deselects invalid items if received items start at index 0

### Delete

- Client preemptively deletes items
  - Must never trigger load more action
- Client sends *keys to be deleted*, *list version*, *last loaded index* and *last visible index*
- Server saves the list version before deleting any items
- Server deletes the items
- Server updates the list version
- Server checks the client's list version
  - If same as the **saved** version, responds with items from *last loaded index* to *last visible index* (if range non-negative)
  - If different, responds with items from beginning to *last visible index*
  - Always includes list version in response
- Client replaces items with received and updates list version
  - Deselects invalid items if received items start at index 0