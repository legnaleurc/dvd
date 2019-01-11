import { all } from 'redux-saga/effects';

import {
  sagaGetList,
  sagaGetRoot,
  sagaPostSync,
  sagaOpenStreamUrl,
} from './file_system/actions';
import { sagaGetSearchName } from './search/actions';
import {
  sagaMoveSelectedNodesTo,
  sagaSelectSiblingList,
  sagaSelectMatchedList,
  sagaDeleteSelectedNodes,
  sagaCopySelected,
  sagaDownloadSelected,
} from './selection/actions';
import { sagaLoadMultiPageViewer } from './multipage/actions';


export default function * ({ fileSystem }) {
  yield all([
    sagaGetList(fileSystem),
    sagaGetRoot(fileSystem),
    sagaPostSync(fileSystem),
    sagaOpenStreamUrl(fileSystem),
    sagaGetSearchName(fileSystem),
    sagaMoveSelectedNodesTo(fileSystem),
    sagaSelectSiblingList(),
    sagaSelectMatchedList(),
    sagaDeleteSelectedNodes(fileSystem),
    sagaCopySelected(fileSystem),
    sagaDownloadSelected(fileSystem),
    sagaLoadMultiPageViewer(fileSystem),
  ]);
}
