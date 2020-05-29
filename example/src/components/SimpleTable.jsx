import React from 'react';
import { Table, withTable } from 'react-select-table';

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
                pageSize={3}
                columns={columns}
                className="table" />
            {pageCount}
        </div>
    )
}

export default withTable("test",
    { valueProperty: "id", scrollX: true },
)(SimpleTable);
