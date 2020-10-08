import { combineReducers } from 'redux';

import reduceFileSystem from './file_system/reducers';


export const reducer = combineReducers({
  fileSystem: reduceFileSystem,
});
export type IGlobalStateType = ReturnType<typeof reducer>;
