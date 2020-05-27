import React, { Component } from 'react'
import { Table, initTable, disposeTable } from 'react-select-table';

import todos from "../todos";
import columns from "../columns";

class SimpleClassTable extends Component {
    componentDidMount() {
        initTable("test1", { valueProperty: "id", scrollX: true });
    }

    componentWillUnmount() {
        disposeTable("test1");
    }

    render() {
        return <Table
            items={todos}
            columns={columns}
            className="table"
            name="test1" />
    }
}

export default SimpleClassTable;