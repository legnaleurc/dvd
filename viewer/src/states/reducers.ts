import { combineReducers } from 'redux';

import reduceFileSystem from './file_system/reducers';
import reduceMultiPage from './multipage/reducers';
import reduceSearch from './search/reducers';


export const reducer = combineReducers({
  fileSystem: reduceFileSystem,
  mpv: reduceMultiPage,
  search: reduceSearch,
});
export type IGlobalStateType = ReturnType<typeof reducer>;