import React from 'react'

import testData from "./test-data";
import Table, { createTableOptions } from 'react-select-table'
import 'react-select-table/src/index.scss'

const tableOptions = createTableOptions({
  valueProperty: "id",
  columns: [
    {
      title: "Φωτογραφία",
      path: "thumbnail_url"
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
  return <Table items={testData} options={tableOptions} name="test" />
}

export default App
