import React from 'react'

import testData from "./test-data";
import Table from 'react-select-table'
import 'react-select-table/src/index.scss'
import 'bootstrap/dist/css/bootstrap.css';

const columns = [
  {
    title: "Id",
    path: "id"
  },
  {
    title: "Name",
    path: "name"
  },
  {
    title: "Email",
    path: "email"
  },
  {
    title: "Body",
    path: "body"
  }
];

const App = () => {
  return (
    <div className="h-100">
      <Table
        onDoubleClick={alert}
        items={testData}
        valueProperty="id"
        columns={columns}
        className="table"
        name="test" />
    </div>)
}

export default App
