import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import { hot } from 'react-hot-loader/root';

import SearchList from './search_list';
import MultiPageView from './multipage_view';
import TabView from './tab_view';
import SingleTreeView from './single_tree_view';
import DoubleTreeView from './double_tree_view';
import SettingsView from './settings_view';

import './application.scss';


class Application extends React.PureComponent {

  constructor (props) {
    super(props);
  }

  render () {
    const { match, history } = this.props;
    const tabId = match.params.tabId;
    return (
      <div className="application">
        <TabView
          active={tabId}
          onSwitch={(key) => {
            if (key === tabId) {
              return;
            }
            history.push(`/${key}`);
          }}
        >
          <TabView.LabelContainer>
            <TabView.Label name="tree">
              <div className="block side-1"></div>
            </TabView.Label>
            <TabView.Label name="search">
              <div className="block side-2"></div>
            </TabView.Label>
            <TabView.Label name="double-tree">
              <div className="block side-3"></div>
            </TabView.Label>
            <TabView.Label name="mpv">
              <div className="block side-4"></div>
            </TabView.Label>
            <TabView.Label name="settings">
              <div className="block side-5"></div>
            </TabView.Label>
          </TabView.LabelContainer>
          <TabView.PageContainer>
            <TabView.Page name="tree">
              <SingleTreeView />
            </TabView.Page>
            <TabView.Page name="search">
              <SearchList />
            </TabView.Page>
            <TabView.Page name="double-tree">
              <DoubleTreeView />
            </TabView.Page>
            <TabView.Page name="mpv">
              <MultiPageView />
            </TabView.Page>
            <TabView.Page name="settings">
              <SettingsView />
            </TabView.Page>
          </TabView.PageContainer>
        </TabView>
      </div>
    );
  }

}


class RoutedApplication extends React.Component {

  constructor (props) {
    super(props);
  }

  render () {
    return (
      <BrowserRouter>
        <Switch>
          <Redirect exact from="/" to="/tree" />
          <Route
            path="/:tabId"
            component={Application}
          />
        </Switch>
      </BrowserRouter>
    );
  }

}


export default hot(RoutedApplication);
