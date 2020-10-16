import React from 'react';
import {
  Badge,
  IconButton,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  ChevronLeft as ChevronLeftIcon,
  ImportContacts as ImportContactsIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import { SELECTION_COLOR, getMixins } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { useComicState, useComicAction } from '@/views/hooks/comic';
import {
  SimpleSelectable,
  useSimpleSelectable,
} from '@/views/hooks/simple_selectable';
import { LayoutCacheProvider, useLayoutCache } from './layout_cache';
import { VirtualList } from './virtual_list';
import { ItemView } from './item_view';


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
        <ItemView
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
