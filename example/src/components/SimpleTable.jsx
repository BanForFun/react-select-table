import React from 'react';
import { Table, withTables } from 'react-select-table';

import todos from "../todos";
import columns from "../columns";

function logEvent(type) {
    return args => console.log(type, args);
}

function SimpleTable({ pageCount }) {
    return (
        <div className="container">
            <h1>Simple table</h1>
            <Table
                items={todos}
                onContextMenu={logEvent("Context menu")}
                onSelectionChange={logEvent("Selection")}
                onItemsOpen={logEvent("Open")}
                name="test"
                columns={columns}
                className="table" />
            {pageCount}
        </div>
    )
}

export default withTables({
    test: { valueProperty: "id", scrollX: true, multiSort: true },
})(SimpleTable);
