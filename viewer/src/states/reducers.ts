import { combineReducers } from 'redux';

import reduceFileSystem from './file_system/reducers';
import reduceMultiPage from './multipage/reducers';


export const reducer = combineReducers({
  fileSystem: reduceFileSystem,
  mpv: reduceMultiPage,
});
export type IGlobalStateType = ReturnType<typeof reducer>;
