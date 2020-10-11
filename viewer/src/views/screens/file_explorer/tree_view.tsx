import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins, SELECTION_COLOR, useInstance } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { RichSelectableProvider } from '@/views/hooks/rich_selectable';
import { ContentActionBar } from '@/views/widgets/content_action_bar';
import { TreeNode } from './tree_node';


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
export function TreeView (props: IPropsType) {
  const classes = useStyles();
  const { getSiblingList, getNode, root, revision } = useActions(props);
  if (!root) {
    return null;
  }
  if (!root.children) {
    return null;
  }
  return (
    <div className={classes.treeView}>
      <RichSelectableProvider
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
          <ContentActionBar getNode={getNode} />
        </div>
      </RichSelectableProvider>
    </div>
  );
}


function useActions (props: IPropsType) {
  const { rootId } = props;
  const { nodes, revision } = useFileSystemState();
  const { getNode } = useFileSystemAction();
  const root = rootId ? nodes[rootId] : null;

  const self = useInstance(() => ({
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
  }), [nodes]);

  const getSiblingList = React.useCallback((id: string) => {
    return self.current.getSiblingList(id);
  }, [self]);

  return {
    root,
    revision,
    getNode,
    getSiblingList,
  };
}
