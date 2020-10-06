import { all } from 'redux-saga/effects';

import { FileSystem } from '../lib';
import {
  sagaGetList,
  sagaGetRoot,
  sagaPostSync,
  sagaMoveNodes,
  sagaOpenStreamUrl,
  sagaCopyStream,
  sagaDownloadStream,
  sagaTrashNodes,
} from './file_system/actions';
import { sagaLoadMultiPageViewer } from './multipage/actions';


export function * saga (opts: { fileSystem: FileSystem }) {
  const { fileSystem } = opts;
  yield all([
    sagaGetList(fileSystem),
    sagaGetRoot(fileSystem),
    sagaPostSync(fileSystem),
    sagaMoveNodes(fileSystem),
    sagaOpenStreamUrl(fileSystem),
    sagaCopyStream(fileSystem),
    sagaDownloadStream(fileSystem),
    sagaTrashNodes(fileSystem),
    sagaLoadMultiPageViewer(fileSystem),
  ]);
}
