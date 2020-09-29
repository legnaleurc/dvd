import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ExpandMore, ChevronRight } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import { getMixins, useInstance } from '@/lib';
import {
  getList,
  moveNodes,
  openStreamUrl,
} from '@/states/file_system/actions';
import { IGlobalStateType } from '@/states/reducers';
import { Node } from '@/states/file_system/types';
import { Dragable, Dropable } from '@/views/hooks/dragdrop';
import {
  SelectableArea,
  SelectableTrigger,
  connectSelection,
  ISelectionStateType,
} from '@/views/hooks/selectable';


const INDICATOR_SIZE = 20;


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


interface IProps {
  nodeId: string;
}
interface ISelectionProps {
  selected: boolean;
  getSelectionList: () => string[];
}
interface IGlobalProps {
  node: Node;
  getChildren: (id: string) => void;
  moveNodes: (srcList: string[], dst: string) => void;
  openFileUrl: (id: string) => void;
}


function useActions (props: IProps & ISelectionProps & IGlobalProps) {
  const self = useInstance(() => ({
    openFile () {
      const { openFileUrl, node } = props;
      openFileUrl(node.id);
    },
    getSelection () {
      const { getSelectionList } = props;
      const list = getSelectionList();
      return list;
    },
    acceptNodes (list: string[]) {
      const { node, moveNodes } = props;
      if (node.children) {
        moveNodes(list, node.id);
      } else {
        if (!node.parentId) {
          return;
        }
        moveNodes(list, node.parentId);
      }
    },
  }), [
    props.node,
    props.openFileUrl,
    props.getSelectionList,
    props.moveNodes,
  ]);

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
    onDragStart,
    onDrop,
    onDoubleClick,
  };
}


interface IActionType {
  type: string;
}
interface IStateType {
  expanded: boolean;
}
function reduce (state: IStateType, action: IActionType) {
  switch (action.type) {
    case 'TOGGLE':
      return {
        ...state,
        expanded: !state.expanded,
      };
    default:
      return state;
  }
}


function TreeNode (props: IProps & ISelectionProps & IGlobalProps) {
  const { node, selected } = props;

  const classes = useStyles();
  const {
    onDragStart,
    onDrop,
    onDoubleClick,
  } = useActions(props);
  const [state, dispatch] = React.useReducer(reduce, {
    expanded: false,
  });

  return (
    <div className={classes.treeNode}>
      <Dragable
        enabled={selected}
        onDragStart={onDragStart}
      >
        <Dropable
          onDrop={onDrop}
        >
          <SelectableArea nodeId={node.id}>
            <div className={classes.head}>
              <MaybeIndicator
                node={node}
                expanded={state.expanded}
                getChildren={props.getChildren}
                dispatch={dispatch}
              />
              <div
                className={clsx({
                  [classes.shift]: !node.children,
                })}
                onDoubleClick={onDoubleClick}
              >
                <SelectableTrigger nodeId={node.id}>
                  {node.name}
                </SelectableTrigger>
              </div>
            </div>
          </SelectableArea>
          <MaybeChildren
            node={node}
            expanded={state.expanded}
            classes={classes}
          />
        </Dropable>
      </Dragable>
    </div>
  );
}


const useIndicatorStyles = makeStyles((theme) => ({
  indicator: {
    lineHeight: 0,
    '& > $icon': {
      width: INDICATOR_SIZE,
      height: INDICATOR_SIZE,
    },
  },
  icon: {},
}));


interface IMaybeIndicatorProps {
  node: Node;
  expanded: boolean;
  getChildren: (id: string) => void;
  dispatch: React.Dispatch<IActionType>;
}
function MaybeIndicator (props: IMaybeIndicatorProps) {
  const { node, expanded } = props;

  const classes = useIndicatorStyles();
  const self = useInstance(() => ({
    toggle () {
      const { node, getChildren, dispatch } = props;
      if (!node.fetched) {
        getChildren(node.id);
      }
      dispatch({
        type: 'TOGGLE',
      });
    },
  }), [
    props.node,
    props.getChildren,
    props.dispatch,
  ]);

  const onClickIndicator = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    self.current.toggle();
  }, []);

  if (!node.children) {
    return null;
  }
  return (
    <div
      onClick={onClickIndicator}
      className={classes.indicator}
    >
      {expanded ? (
        <ExpandMore className={classes.icon} />
      ) : (
        <ChevronRight className={classes.icon} />
      )}
    </div>
  );
}


interface IMaybeChildrenProps {
  node: Node;
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
        <ConnectedTreeNode key={nodeId} nodeId={nodeId} />
      ))}
    </div>
  );
}


function mapStateToProps (state: IGlobalStateType, ownProps: IProps) {
  const { fileSystem } = state;
  const { nodeId } = ownProps;

  return {
    node: fileSystem.nodes[nodeId],
  };
}


function mapDispatchToProps (dispatch: Dispatch) {
  return {
    getChildren (id: string) {
      dispatch(getList(id));
    },
    openFileUrl (id: string) {
      dispatch(openStreamUrl(id));
    },
    moveNodes (nodeList: string[], id: string) {
      dispatch(moveNodes(nodeList, id));
    },
  };
}


const ConnectedTreeNode = (Component => {
  const selectionDecorator = connectSelection((
    value: ISelectionStateType,
    ownProps: IProps & IGlobalProps,
  ) => ({
    selected: value.selected[ownProps.nodeId],
    getSelectionList: value.getList,
  }));
  const SelectableComponent = selectionDecorator(Component);

  const globalDecorator = connect(mapStateToProps, mapDispatchToProps);
  const ConnectedComponent = globalDecorator(SelectableComponent);

  return ConnectedComponent;
})(React.memo(TreeNode));
export { ConnectedTreeNode as TreeNode };
