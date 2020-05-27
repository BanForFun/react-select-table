import React from 'react';
import { Switch, Route, Redirect } from "react-router-dom";

import SimpleTable from './components/SimpleTable';
import ReduxTable from './components/ReduxTable';
import SimpleClassTable from './components/SimpleClassTable';

import 'bootstrap/dist/css/bootstrap.css';
import 'react-select-table/dist/index.css';


function App() {
  return <div id="app">
    <Switch>
      <Route path="/simple" component={SimpleTable} />
      <Route path="/redux" component={ReduxTable} />
      <Route path="/simpleClass" component={SimpleClassTable} />
      <Redirect from="/" exact to="/simple" />
    </Switch>
  </div>
}

export default App;
