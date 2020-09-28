 ### Utilities

#### `getTableSlice`

Parameters:

* `state` *any*
* `namespace` *string*

Finds and returns the table's state by `namespace`

#### `setDefaultOptions`

Parameters:

* `options` *object*

Assigns the properties of `options` to the default [options object](./options.md).

Note: This function must be called before any call to `createTable` or `withTables`. One way to do that is to call it before importing App.js:

**index.js**

````javascript
import React from "react";
import ReactDOM from 'react-dom';
import "./rst-init"
import App from "./App"

ReactDom.render(...)
````

**rst-init.js**

```javascript
import { setDefaultOptions } from "react-select-table";

setDefaultOptions({
    //Your default options here
    valueProperty: "_id"
})
```

