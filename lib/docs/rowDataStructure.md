# Row data structure performance

| Operation | SLList     | DLList + HashTable |      |
| --------- | ---------- | ------------------ | ---- |
| Add       | R*logR + N | R*logR + N         |      |
| Clear     | N          | N                  |      |
| Remove    | N          | K                  |      |
| Append    | R          | R                  |      |
| Replace   | N          | R                  |      |
|           |            |                    |      |
|           |            |                    |      |
|           |            |                    |      |
|           |            |                    |      |

