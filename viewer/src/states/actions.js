import { all } from 'redux-saga/effects';

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
import { sagaGetSearchName, sagaCompare } from './search/actions';
import { sagaLoadMultiPageViewer } from './multipage/actions';


export default function * ({ fileSystem }) {
  yield all([
    sagaGetList(fileSystem),
    sagaGetRoot(fileSystem),
    sagaPostSync(fileSystem),
    sagaMoveNodes(fileSystem),
    sagaOpenStreamUrl(fileSystem),
    sagaCopyStream(fileSystem),
    sagaDownloadStream(fileSystem),
    sagaTrashNodes(fileSystem),
    sagaGetSearchName(fileSystem),
    sagaCompare(),
    sagaLoadMultiPageViewer(fileSystem),
  ]);
}
