import "./App.scss";

import React from 'react';
import { Switch, Route, Redirect } from "react-router-dom";

import FullDemo from './components/FullDemo';

function App() {
  return <div id="app">
    <Switch>
      <Route path="/full" component={FullDemo} />
      <Redirect from="/" exact to="/full" />
    </Switch>
  </div>
}

export default App;
