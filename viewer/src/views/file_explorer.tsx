import React from 'react';
import { connect } from 'react-redux';

import { Node } from '../states/file_system/types';
import { IGlobalStateType } from '../states/reducers';
import { Selectable } from './selectable';
import { TreeNode } from './tree_node';
import { ContentActionBar } from './content_action_bar';

import './file_explorer.scss';


interface IPropsType {
  rootId: string | null;
}
interface IPrivatePropsType {
  root: Node | null;
  revision: number;

  getSiblingList: (id: string) => string[] | null;
}


class FileExplorer extends React.PureComponent<IPropsType & IPrivatePropsType> {

  render () {
    const { getSiblingList, root, revision } = this.props;
    if (!root) {
      return null;
    }
    if (!root.children) {
      return null;
    }
    return (
      <div className="file-explorer">
        <Selectable getSourceList={getSiblingList} revision={revision}>
          <div className="head">
            <ContentActionBar />
          </div>
          <div className="tail">
            {root.children.map(nodeId => (
              <TreeNode key={nodeId} nodeId={nodeId} />
            ))}
          </div>
        </Selectable>
      </div>
    );
  }

}


function mapStateToProps (state: IGlobalStateType, ownProps: IPropsType) {
  const { nodes, revision } = state.fileSystem;
  const { rootId } = ownProps;
  return {
    root: rootId ? nodes[rootId] : null,
    revision,
    getSiblingList (id: string) {
      const node = nodes[id];
      if (!node) {
        return null;
      }
      if (!node.parentId) {
        return null;
      }
      const parent = nodes[node.parentId];
      if (!parent) {
        return null;
      }
      return parent.children;
    },
  };
}


const ConnectedFileExplorer = connect(mapStateToProps)(FileExplorer);
export { ConnectedFileExplorer as FileExplorer };
