import React from 'react';
import { Table, withTables, useTable } from 'react-select-table';

import todos from "../todos";
import columns from "../columns";

function log(type) {
    return args => console.log(type, args);
}

function SimpleTable() {
    const {pageCount, tableProps} = useTable("test");

    return (
        <div id="simple">
            <Table
                {...tableProps}
                items={todos}
                onContextMenu={log("Context menu")}
                onItemsOpen={log("Open")}
                initColumnWidths={[10, 70, 20]}
                columns={columns}
                className="table"
            />
            {pageCount}
        </div>
    )
}

export default withTables(SimpleTable, {
    test: {
        valueProperty: "id",
        scrollX: true,
        multiSort: true
    }
});
