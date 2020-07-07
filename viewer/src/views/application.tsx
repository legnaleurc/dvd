import React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';

import { SearchView } from './search_view';
import { MultiPageView } from './multipage_view';
import {
  TabView,
  TabLabelContainer,
  TabLabel,
  TabPageContainer,
  TabPage,
} from './tab_view';
import { TreeView } from './tree_view';
import { SettingsView } from './settings_view';

import './application.scss';


class Application extends React.PureComponent<RouteComponentProps<{ tabId: string }>> {

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
          <TabLabelContainer>
            <TabLabel name="tree">
              <div className="block side-1"></div>
            </TabLabel>
            <TabLabel name="search">
              <div className="block side-2"></div>
            </TabLabel>
            <TabLabel name="mpv">
              <div className="block side-3"></div>
            </TabLabel>
            <TabLabel name="settings">
              <div className="block side-4"></div>
            </TabLabel>
          </TabLabelContainer>
          <TabPageContainer>
            <TabPage name="tree">
              <TreeView />
            </TabPage>
            <TabPage name="search">
              <SearchView />
            </TabPage>
            <TabPage name="mpv">
              <MultiPageView />
            </TabPage>
            <TabPage name="settings">
              <SettingsView />
            </TabPage>
          </TabPageContainer>
        </TabView>
      </div>
    );
  }

}


class RoutedApplication extends React.PureComponent {

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


const HotApplication = hot(RoutedApplication);
export { HotApplication as Application };
