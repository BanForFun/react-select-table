import React from 'react'

import testData from "./test-data";
import { Table } from 'react-select-table';
import 'react-select-table/dist/index.css';
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

  const log = title => msg =>
    console.log(title, msg);

  return (
    <div className="h-100">
      <Table
        items={testData.slice(0, 100)}
        valueProperty="id"
        columns={columns}
        name="test" />
    </div>)
}

export default App
