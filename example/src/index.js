import 'react-toastify/dist/ReactToastify.css';
import "./index.css";

import React from "react";
import App from "./App";
import { HashRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";

import { createRoot } from 'react-dom/client';

const container = document.getElementById("root")
const root = createRoot(container);

root.render(
  <HashRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </HashRouter>,
);
