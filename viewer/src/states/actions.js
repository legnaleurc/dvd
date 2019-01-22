import { all } from 'redux-saga/effects';

import {
  sagaGetList,
  sagaGetRoot,
  sagaPostSync,
  sagaMoveNodes,
  sagaOpenStreamUrl,
  sagaCopyStream,
  sagaDownloadStream,
} from './file_system/actions';
import { sagaGetSearchName } from './search/actions';
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
    sagaGetSearchName(fileSystem),
    sagaLoadMultiPageViewer(fileSystem),
  ]);
}
