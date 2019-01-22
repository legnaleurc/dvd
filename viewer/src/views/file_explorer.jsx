import React from 'react';
import { connect } from 'react-redux';

import Selectable from './selectable';
import TreeNode from './tree_node';
import ContentActionBar from './content_action_bar';


class FileExplorer extends React.PureComponent {

  constructor (props) {
    super(props);
  }

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
          <div className="group">
            <ContentActionBar />
          </div>
          <div className="group">
            {root.children.map(nodeId => (
              <TreeNode key={nodeId} nodeId={nodeId} />
            ))}
          </div>
        </Selectable>
      </div>
    );
  }

}


function mapStateToProps (state, ownProps) {
  const { nodes, revision } = state.fileSystem;
  const { rootId } = ownProps;
  return {
    root: rootId ? nodes[rootId] : null,
    revision,
    getSiblingList (id) {
      const node = nodes[id];
      if (!node) {
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


export default connect(mapStateToProps)(FileExplorer);
