import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';

import { Application } from './views/application';
import { FileSystem } from './lib';
import { reducer } from './states/reducers';
import { saga } from './states/actions';
import { getRoot } from './states/file_system/actions';

import './index.scss';


const fileSystem = new FileSystem();

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducer, composeWithDevTools(applyMiddleware(sagaMiddleware)));

sagaMiddleware.run(saga, {
  fileSystem,
});

ReactDOM.render(
  <Provider store={store}>
    <Application />
  </Provider>,
  document.querySelector('body > .body'));

store.dispatch(getRoot());