import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import {
  Badge,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  ImportContacts as ImportContactsIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import { SELECTION_COLOR, getMixins } from '@/lib';
import { Node } from '@/states/file_system/types';
import { IGlobalStateType } from '@/states/reducers';
import { getList } from '@/states/file_system/actions';
import {
  SimpleSelectable,
  useSimpleSelectable,
} from '@/views/hooks/simple_selectable';
import {
  VirtualList,
  LayoutCacheProvider,
  useLayoutCache,
} from './virtual_list';
import { useComic } from '../hooks/comic';


const TOOLBAR_HEIGHT = 56;


const useStyles = makeStyles((theme) => ({
  listView: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'no-scroll',
      'vbox',
    ]),
  },
  head: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'no-scroll',
      'vbox',
    ]),
    wordBreak: 'break-all',
    overflowWrap: 'anywhere',
    '& .MuiListItem-secondaryAction': {
      paddingRight: 64,
    },
  },
  tail: {
    ...getMixins([
      'w-100',
      'hbox',
    ]),
    position: 'fixed',
    height: TOOLBAR_HEIGHT,
    bottom: 0,
    backgroundColor: theme.palette.background.paper,
    boxSizing: 'border-box',
    padding: '0.25rem',
    justifyContent: 'space-between',
  },
  selected: {
    backgroundColor: SELECTION_COLOR,
  },
  fakeToolBar: {
    // Safari need more space
    height: TOOLBAR_HEIGHT,
  },
  virtualList: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'no-scroll',
    ]),
  },
}));


interface IProps {
  rootId: string | null;
}
export function ListView (props: IProps) {
  const classes = useStyles();
  const [nodeId, setNodeId] = React.useState(props.rootId);

  React.useEffect(() => {
    setNodeId(props.rootId);
  }, [props.rootId, setNodeId]);

  return (
    <LayoutCacheProvider
      fixedWidth={true}
      minHeight={50}
      defaultHeight={50}
    >
      <SimpleSelectable>
        <div className={classes.listView}>
          <div className={classes.head}>
            <div className={classes.virtualList}>
              <ConnectedDynamicListView
                rootId={nodeId}
                setRootId={setNodeId}
              />
            </div>
            <div className={classes.fakeToolBar} />
          </div>
          <div className={classes.tail}>
            <ConnectedToolBar
              nodeId={nodeId}
              setNodeId={setNodeId}
            />
          </div>
        </div>
      </SimpleSelectable>
    </LayoutCacheProvider>
  );
}


interface IDynamicListViewProps {
  rootId: string | null;
  setRootId: (id: string) => void;
}
interface IPrivateProps {
  root: Node | null;
}
function DynamicListView (props: IDynamicListViewProps & IPrivateProps) {
  const { setRootId, root } = props;

  if (!root) {
    return null;
  }
  if (!root.children) {
    return null;
  }
  const children = root.children;

  return (
    <VirtualList
      count={children.length}
      renderer={({ index, style, itemRef }) => (
        <ConnectedFileOrFolderItem
          nodeId={children[index]}
          setRootId={setRootId}
          isLast={index === (children.length - 1)}
          style={style}
          itemRef={itemRef}
        />
      )}
    />
  );
}
const ConnectedDynamicListView = (() => {
  function mapStateToProps (state: IGlobalStateType, ownProps: IDynamicListViewProps) {
    const { nodes } = state.fileSystem;
    const { rootId } = ownProps;
    return {
      root: rootId ? nodes[rootId] : null,
    };
  }

  return connect(mapStateToProps)(DynamicListView);
})();


interface IToolBarProps {
  nodeId: string | null;
  setNodeId: (id: string) => void;
}
interface IGlobalToolBarProps {
  node: Node | null;
  fileLoading: boolean;
}
function ToolBar (props: IToolBarProps & IGlobalToolBarProps) {
  const {
    fileLoading,
    node,
    setNodeId,
  } = props;

  const { unpacking: fileUnpacking, loadComic } = useComic();
  const { dict, count, clear } = useSimpleSelectable();
  const { cache } = useLayoutCache();

  const onBack = React.useCallback(() => {
    if (node && node.parentId) {
      cache.clearAll();
      setNodeId(node.parentId);
    }
  }, [node, setNodeId, cache]);
  const onComic = React.useCallback(async () => {
    const list = (
      Object.entries(dict)
      .filter(([id, value]) => value)
      .map(([id, value]) => id)
    );
    if (list.length !== 1) {
      return;
    }
    await loadComic(list[0], '');
    clear();
  }, [clear, dict, loadComic]);

  return (
    <>
      <IconButton
        disabled={fileLoading || !node || !node.parentId}
        onClick={onBack}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        disabled={count === 0}
        onClick={clear}
      >
        <Badge
          badgeContent={count}
          color="secondary"
        >
          <RemoveShoppingCartIcon />
        </Badge>
      </IconButton>
      <IconButton
        disabled={fileLoading || fileUnpacking || count !== 1}
        onClick={onComic}
      >
        <ImportContactsIcon />
      </IconButton>
    </>
  );
}
const ConnectedToolBar = (() => {
  function mapStateToProps (state: IGlobalStateType, ownProps: IToolBarProps) {
    const { nodes, updating } = state.fileSystem;
    const { nodeId } = ownProps;
    return {
      node: nodeId ? nodes[nodeId] : null,
      fileLoading: updating,
    };
  }

  return connect(mapStateToProps)(ToolBar);
})();


interface IFileOrFolderItemProps {
  nodeId: string;
  setRootId: (id: string) => void;
  isLast: boolean;
  style: React.CSSProperties;
  itemRef: (element: Element | null) => void;
}
interface IPrivateFileOrFolderItemProps {
  node: Node;
  getChildren: (id: string) => void;
}
function FileOrFolderItem (props: IFileOrFolderItemProps & IPrivateFileOrFolderItemProps) {
  const {
    getChildren,
    isLast,
    itemRef,
    node,
    setRootId,
    style,
  } = props;

  const { dict, toggle, clear } = useSimpleSelectable();
  const { cache } = useLayoutCache();

  const switchId = React.useCallback((id: string) => {
    clear();
    cache.clearAll();
    getChildren(id);
    setRootId(id);
  }, [clear, getChildren, setRootId, cache]);

  if (!node.children) {
    return (
      <FileItem
        node={node}
        toggle={toggle}
        selected={dict[node.id]}
        style={style}
        itemRef={itemRef}
        isLast={isLast}
      />
    );
  } else {
    return (
      <FolderItem
        node={node}
        toggle={toggle}
        selected={dict[node.id]}
        style={style}
        itemRef={itemRef}
        isLast={isLast}
        switchId={switchId}
      />
    );
  }
}
const ConnectedFileOrFolderItem = (() => {
  function mapStateToProps (state: IGlobalStateType, ownProps: IFileOrFolderItemProps) {
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
    };
  }

  return connect(mapStateToProps, mapDispatchToProps)(FileOrFolderItem);
})();


interface IItemProps {
  node: Node;
  selected: boolean;
  toggle: (id: string) => void;
  isLast: boolean;
  style: React.CSSProperties;
  itemRef: (element: HTMLDivElement) => void;
}


interface IFileItemProps extends IItemProps {
}
function FileItem (props: IFileItemProps) {
  const { node, selected, toggle, style, itemRef, isLast } = props;
  const onSelect = React.useCallback(() => {
    toggle(node.id);
  }, [toggle, node]);
  return (
    <ListItem
      ContainerComponent="div"
      button={true}
      selected={selected}
      onClick={onSelect}
      style={style}
      ref={itemRef}
      divider={!isLast}
    >
      <ListItemIcon></ListItemIcon>
      <ListItemText
        primary={node.name}
      />
    </ListItem>
  );
}


interface IFolderItemProps extends IItemProps {
  switchId: (id: string) => void;
}
function FolderItem (props: IFolderItemProps) {
  const {
    isLast,
    itemRef,
    node,
    selected,
    style,
    switchId,
    toggle,
  } = props;

  const onSelect = React.useCallback(() => {
    toggle(node.id);
  }, [toggle, node]);
  const onOpenFolder = React.useCallback(() => {
    switchId(node.id);
  }, [switchId, node]);

  return (
    <ListItem
      ContainerComponent="div"
      ContainerProps={{
        style,
      }}
      ref={itemRef}
      button={true}
      selected={selected}
      onClick={onSelect}
      divider={!isLast}
    >
      <ListItemIcon>
        <FolderIcon />
      </ListItemIcon>
      <ListItemText
        primary={node.name}
      />
      <ListItemSecondaryAction>
        <IconButton onClick={onOpenFolder}>
          <ChevronRightIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}
