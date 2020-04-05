import React from 'react'

import testData from "./test-data";
import Table, { createTableOptions } from 'react-select-table'
import 'react-select-table/src/index.scss'
import 'bootstrap/dist/css/bootstrap.css';

const tableOptions = createTableOptions({
  valueProperty: "pet_id",
  columns: [
    {
      title: "Φωτογραφία",
      path: "thumbnail_url",
      render: url => <img src={url} />
    },
    {
      title: "Φύλλο",
      path: "sex"
    },
    {
      title: "Ιδιοκτησία",
      path: "ownership"
    },
    {
      title: "Κατάσταση",
      path: "status"
    },
    {
      title: "Μέγεθος",
      path: "size"
    }
  ]
});

const App = () => {
  return (
    <Table
      items={testData}
      options={tableOptions}
      className="table"
      name="test" />)
}

export default App
