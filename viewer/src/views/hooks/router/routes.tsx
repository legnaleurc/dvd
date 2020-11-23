import React from 'react';
// HACK: Import from react-router-dom instead of react-router to prevent UMD
// bundle error.
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useParams,
  useRouteMatch,
} from 'react-router-dom';

import { ComicMatchParam, RootMatchParam } from './types';


interface IRootRoute {
  component: React.ComponentType<{}>;
}
export function RootRoute(props: IRootRoute) {
  return (
    <Switch>
      <Redirect exact={true} from="/" to="/files" />
      <Route
        path="/:tabId"
        component={props.component}
      />
    </Switch>
  );
}


export function useRootParams () {
  return useParams<RootMatchParam>();
}


interface IComicRoute {
  defaultComponent: React.ComponentType<{}>;
  component: React.ComponentType<{}>;
}
export function ComicRoute(props: IComicRoute) {
  const { path } = useRouteMatch<ComicMatchParam>();
  return (
    <Switch>
      <Route exact={true} path={`${path}`} component={props.defaultComponent} />
      <Route path={`${path}/:comicId`} component={props.component} />
    </Switch>
  );
}


export function useComicParams () {
  return useParams<ComicMatchParam>();
}


export function useNavigation () {
  const history = useHistory();
  const { url } = useRouteMatch();

  type HistoryType = typeof history;
  type ListenerType = Parameters<HistoryType['listen']>[0];

  const absGoTo = React.useCallback((path: string) => {
    history.push(path);
  }, [history]);
  const relGoTo = React.useCallback((path: string) => {
    history.push(`${url}${path}`);
  }, [history, url]);
  const listenTo = React.useCallback((listener: ListenerType) => {
    return history.listen(listener);
  }, [history]);

  return {
    absGoTo,
    relGoTo,
    listenTo,
  };
}
