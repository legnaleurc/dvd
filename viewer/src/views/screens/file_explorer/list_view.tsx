import React from 'react';
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
import {
  useFileSystemAction,
  useFileSystemState,
  Node,
} from '@/views/hooks/file_system';
import { useComicState, useComicAction } from '@/views/hooks/comic';
import {
  SimpleSelectable,
  useSimpleSelectable,
} from '@/views/hooks/simple_selectable';
import {
  VirtualList,
  LayoutCacheProvider,
  useLayoutCache,
} from './virtual_list';


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
              <DynamicListView
                rootId={nodeId}
                setRootId={setNodeId}
              />
            </div>
            <div className={classes.fakeToolBar} />
          </div>
          <div className={classes.tail}>
            <ToolBar
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
function DynamicListView (props: IDynamicListViewProps) {
  const { setRootId, rootId } = props;
  const { nodes } = useFileSystemState();

  if (!rootId) {
    return null;
  }
  const root = nodes[rootId];
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
        <FileOrFolderItem
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


interface IToolBarProps {
  nodeId: string | null;
  setNodeId: (id: string) => void;
}
function ToolBar (props: IToolBarProps) {
  const { nodeId, setNodeId } = props;

  const { updating: fileLoading, nodes } = useFileSystemState();
  const { getNode } = useFileSystemAction();
  const { unpacking: fileUnpacking } = useComicState();
  const { loadComic } = useComicAction();
  const { dict, count, clear } = useSimpleSelectable();
  const { cache } = useLayoutCache();

  const node = nodeId ? nodes[nodeId] : null;

  const onBack = React.useCallback(() => {
    if (node && node.parentId) {
      cache.clearAll();
      clear();
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
    const node = getNode(list[0]);
    await loadComic(node.id, node.name);
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


interface IFileOrFolderItemProps {
  nodeId: string;
  setRootId: (id: string) => void;
  isLast: boolean;
  style: React.CSSProperties;
  itemRef: (element: Element | null) => void;
}
function FileOrFolderItem (props: IFileOrFolderItemProps) {
  const {
    isLast,
    itemRef,
    nodeId,
    setRootId,
    style,
  } = props;

  const { loadList: getChildren } = useFileSystemAction();
  const { nodes } = useFileSystemState();
  const { dict, toggle, clear } = useSimpleSelectable();
  const { cache } = useLayoutCache();

  const node = nodes[nodeId];

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
