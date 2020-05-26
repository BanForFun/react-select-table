import React from 'react'
import { Table, useTable } from 'react-select-table';

import todos from "../todos";
import columns from "../columns";

function logEvent(type) {
    return args => console.log(type, args);
}

function SimpleTable() {
    useTable("test", { valueProperty: "id", scrollX: true });

    return (
        <div className="container">
            <h1>Simple table</h1>
            <Table
                items={todos}
                onContextMenu={logEvent("Context menu")}
                onSelectionChange={logEvent("Selection")}
                onItemsOpen={logEvent("Open")}
                columns={columns}
                className="table"
                name="test" />
        </div>
    )
}

export default SimpleTable;
