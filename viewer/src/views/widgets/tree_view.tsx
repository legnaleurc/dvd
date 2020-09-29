import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins, SELECTION_COLOR } from '@/lib';
import { Node } from '@/states/file_system/types';
import { IGlobalStateType } from '@/states/reducers';
import { Selectable } from '@/views/hooks/selectable';
import { TreeNode } from './tree_node';
import { ContentActionBar } from './content_action_bar';


const useStyles = makeStyles((theme) => ({
  treeView: {
    ...getMixins([
      'w-100',
      'h-100',
      'hbox',
    ]),
  },
  head: {
    ...getMixins([
      'size-grow',
      'w-100',
      // IMPORTANT set min-height to have scroll for children
      'mh-0',
      'y-scroll',
    ]),
    overflowWrap: 'anywhere',
    paddingTop: '0.25rem',
    paddingBottom: '0.25rem',
  },
  tail: {
    ...getMixins([
      'size-shrink',
      'vbox',
    ]),
  },
  selected: {
    backgroundColor: SELECTION_COLOR,
  },
}));


interface IPropsType {
  rootId: string | null;
}
interface IPrivatePropsType {
  root: Node | null;
  revision: number;

  getSiblingList: (id: string) => string[] | null;
}
function TreeView (props: IPropsType & IPrivatePropsType) {
  const classes = useStyles();
  const { getSiblingList, root, revision } = props;
  if (!root) {
    return null;
  }
  if (!root.children) {
    return null;
  }
  return (
    <div className={classes.treeView}>
      <Selectable
        getSourceList={getSiblingList}
        revision={revision}
        classes={classes}
      >
        <div className={classes.head}>
          {root.children.map(nodeId => (
            <TreeNode key={nodeId} nodeId={nodeId} />
          ))}
        </div>
        <div className={classes.tail}>
          <ContentActionBar />
        </div>
      </Selectable>
    </div>
  );
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


const ConnectedTreeView = connect(mapStateToProps)(TreeView);
export { ConnectedTreeView as TreeView };
