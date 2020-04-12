import "./App.css";

import { Route, Router, Switch } from "react-router-dom";

import { CReduxComp } from "./sample/ReduxComp";
import { ErrorBoundary } from "./base/ErrorBoundary";
import { Layout } from "antd";
import { Provider } from "react-redux";
import React from "react";
import { TopBarComponent } from "./nav/TopBar";
import { TreeView } from "./components/TreeView";
import { getOrCreateHistory } from "./utils/history";
import { setupStore } from "./redux";

// === Init Start {
const store = setupStore();

// } Init End

function DummyComp() {
  return <div>DummyComp</div>;
}

function AppSwitch() {
  return (
    <Switch>
      <Route exact path="/" component={TreeView} />
      <Route exact path="/test1" component={CReduxComp} />
      <Route exact path="/test2" component={DummyComp} />
    </Switch>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router history={getOrCreateHistory() as any}>
        <ErrorBoundary>
          <Layout>
            <TopBarComponent />
            <AppSwitch></AppSwitch>
          </Layout>
        </ErrorBoundary>
      </Router>
    </Provider>
  );
}

export default App;
