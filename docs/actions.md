# Actions

The action creators are accessible from a `TableActions` instance. The constructor takes the table [namespace][namespace] as the parameter.

The action types are static variables of the `TableActions` class.

```javascript
import { TableActions } from "react-select-table";

//Create a TableActions instance
const todoActions = new TableActions("todo");

//To add todos you can use
dispatch(todoActions.addItems({
    id: "1",
    name: "Make coffee",
    completed: true
}, {
    id: "2",
    name: "Drink coffee",
    completed: false
}))

//You can also access the action types
const { type, payload, namespace } = action;
switch (type) {
    case TableActions.ADD_ITEMS:
        console.log(`Added items in ${namespace} table`, payload.items);
        break;
}
```



## Action creators

Below each action creator, the action type static variable is listed. The actual value is different.

### Items



### Display



### Selection



### Pagination

