import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import { getMixins, useInstance } from '@/lib';
import {
  Node_,
  INodeLike,
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { useQueueAction } from '@/views/hooks/queue';
import { Dragable, Dropable } from '@/views/hooks/dragdrop';
import {
  RichSelectableArea,
  RichSelectableTrigger,
  useRichSelectableAction,
  useRichSelectableState,
} from '@/views/hooks/rich_selectable';
import { INDICATOR_SIZE } from './types';
import { MaybeIndicator } from './indicator';


const useStyles = makeStyles((theme) => ({
  treeNode: {
    ...getMixins([
      'vbox',
    ]),
    fontFamily: 'monospace',
    '& $head': {
      ...getMixins([
        'hbox',
      ]),
      flexWrap: 'nowrap',
      '& > $shift': {
        marginLeft: INDICATOR_SIZE,
      },
    },
    '& $tail': {
      ...getMixins([
        'vbox',
      ]),
      paddingLeft: INDICATOR_SIZE,
    },
    '& $hidden': {
      display: 'none',
    },
  },
  head: {},
  tail: {},
  shift: {},
  hidden: {},
}));
type Classes = ReturnType<typeof useStyles>;


interface IPureProps {
  node: Node_;
  getChildren: (id: string) => Promise<void>;
  openUrl: (node: INodeLike) => Promise<void>;
  moveNodes: (getNode: (id: string) => INodeLike, srcList: string[], dst: string) => Promise<void>;
  getNode: (id: string) => INodeLike;
  selected: boolean;
  getSelectionList: () => string[];
}


function useActions (props: IPureProps) {
  const [expanded, setExpanded] = React.useState(false);
  const self = useInstance(() => ({
    toggle () {
      setExpanded(!expanded);
    },
    async openFile () {
      const { openUrl, node } = props;
      await openUrl(node);
    },
    getSelection () {
      const { getSelectionList } = props;
      const list = getSelectionList();
      return list;
    },
    async acceptNodes (list: string[]) {
      const { node, moveNodes, getNode } = props;
      if (node.children) {
        await moveNodes(getNode, list, node.id);
      } else {
        if (!node.parentId) {
          return;
        }
        await moveNodes(getNode, list, node.parentId);
      }
    },
  }), [
    props.node,
    props.getSelectionList,
    props.openUrl,
    props.moveNodes,
    props.getNode,
    expanded,
    setExpanded,
  ]);

  const toggle = React.useCallback(() => {
    self.current.toggle();
  }, [self]);

  const onDragStart = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const list = self.current.getSelection();
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(list));
  }, [self]);

  const onDrop = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const raw = event.dataTransfer.getData('text/plain');
    const list: string[] = JSON.parse(raw);
    self.current.acceptNodes(list);
  }, [self]);

  const onDoubleClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    self.current.openFile();
  }, [self]);

  return {
    expanded,
    toggle,
    onDragStart,
    onDrop,
    onDoubleClick,
  };
}


function PureTreeNode (props: IPureProps) {
  const { node, selected, getChildren } = props;
  const classes = useStyles();
  const {
    expanded,
    toggle,
    onDragStart,
    onDrop,
    onDoubleClick,
  } = useActions(props);

  return (
    <div className={classes.treeNode}>
      <Dragable
        enabled={selected}
        onDragStart={onDragStart}
      >
        <Dropable
          onDrop={onDrop}
        >
          <RichSelectableArea nodeId={node.id}>
            <div className={classes.head}>
              <MaybeIndicator
                node={node}
                expanded={expanded}
                toggle={toggle}
                getChildren={getChildren}
              />
              <div
                className={clsx({
                  [classes.shift]: !node.children,
                })}
                onDoubleClick={onDoubleClick}
              >
                <RichSelectableTrigger nodeId={node.id}>
                  {node.name}
                </RichSelectableTrigger>
              </div>
            </div>
          </RichSelectableArea>
          <MaybeChildren
            node={node}
            expanded={expanded}
            classes={classes}
          />
        </Dropable>
      </Dragable>
    </div>
  );
}
const MemorizedPureTreeNode = React.memo(PureTreeNode);


interface IProps {
  nodeId: string;
}
export function TreeNode (props: IProps) {
  const { nodeId } = props;
  const { nodes } = useFileSystemState();
  const { loadList, openUrl, getNode } = useFileSystemAction();
  const { moveNodes } = useQueueAction();
  const { dict } = useRichSelectableState();
  const { getList } = useRichSelectableAction();

  return (
    <MemorizedPureTreeNode
      node={nodes[nodeId]}
      getChildren={loadList}
      openUrl={openUrl}
      moveNodes={moveNodes}
      getNode={getNode}
      selected={dict[nodeId]}
      getSelectionList={getList}
    />
  );
}


interface IMaybeChildrenProps {
  node: Node_;
  expanded: boolean;
  classes: Classes;
}
function MaybeChildren (props: IMaybeChildrenProps) {
  const { node, expanded, classes } = props;
  const { children } = node;

  if (!children || children.length <= 0) {
    return null;
  }

  return (
    <div className={clsx(classes.tail, {
      [classes.hidden]: !expanded,
    })}>
      {children.map(nodeId => (
        <TreeNode key={nodeId} nodeId={nodeId} />
      ))}
    </div>
  );
}
