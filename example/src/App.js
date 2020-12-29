import "./App.scss";

import React from 'react';
import { Switch, Route, Redirect } from "react-router-dom";

import ReduxTable from './components/ReduxTable';

function App() {
  return <div id="app">
    <Switch>
      <Route path="/redux" component={ReduxTable} />
      <Redirect from="/" exact to="/redux" />
    </Switch>
  </div>
}

export default App;
