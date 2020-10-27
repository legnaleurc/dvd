import React from 'react';
import { Badge, Divider, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  FileCopy as FileCopyIcon,
  ChangeHistory as ChangeHistoryIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ImportContacts as ImportContactsIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import { getMixins, useInstance } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
  INodeLike,
} from '@/views/hooks/file_system';
import { useQueueAction, useQueueState } from '@/views/hooks/queue';
import { useComicState, useComicAction } from '@/views/hooks/comic';
import {
  useRichSelectableAction,
  useRichSelectableState,
} from '@/views/hooks/rich_selectable';
import { RenameDialog } from './rename_dialog';
import { QueueDialog } from './queue_dialog';


const useStyles = makeStyles((theme) => ({
  contentActionBar: {
    ...getMixins([
      'h-100',
      'vbox',
    ]),
    '& > $group': {
      ...getMixins([
        'size-shrink',
        'vbox',
      ]),
    },
    '& > $expand': {
      ...getMixins([
        'size-grow',
      ]),
    },
    backgroundColor: theme.palette.background.paper,
  },
  group: {},
  expand: {},
}));


interface IPureProps {
  updating: boolean;
  copyUrl: (idList: string[]) => Promise<void>;
  download: (idList: string[]) => void;
  rename: (id: string, name: string) => Promise<void>;
  trashNodes: (getNode: (id: string) => INodeLike, idList: string[]) => Promise<void>;
  pendingCount: number;
  getNode: (id: string) => INodeLike;
  unpacking: boolean;
  loadComic: (id: string, name: string) => Promise<void>;
  count: number;
  getSelectionList: () => string[];
  clearSelection: () => void;
}


function useActions (props: IPureProps) {
  const {
    updating,
    copyUrl,
    download,
    rename,
    trashNodes,
    getNode,
    unpacking,
    loadComic,
    getSelectionList,
    clearSelection,
  } = props;

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [queueOpen, setQueueOpen] = React.useState(false);

  const self = useInstance(() => ({
    async loadComic () {
      if (unpacking) {
        return;
      }
      const list = getSelectionList();
      if (list.length !== 1) {
        return;
      }
      const node = getNode(list[0]);
      await loadComic(node.id, node.name);
      clearSelection();
    },
    copy () {
      const list = getSelectionList();
      copyUrl(list);
    },
    download () {
      const list = getSelectionList();
      download(list);
    },
    async rename (name: string) {
      const list = getSelectionList();
      if (list.length !== 1) {
        return;
      }
      await rename(list[0], name);
    },
    async trash () {
      const list = getSelectionList();
      await trashNodes(getNode, list);
    },
    get selectedName () {
      const list = getSelectionList();
      if (list.length !== 1) {
        return '';
      }
      const node = getNode(list[0]);
      return node.name;
    },
  }), [
    unpacking,
    getSelectionList,
    clearSelection,
    loadComic,
    copyUrl,
    download,
    rename,
    trashNodes,
    getNode,
  ]);

  const loadComic_ = React.useCallback(async () => {
    await self.current.loadComic();
  }, [self]);
  const copy = React.useCallback(() => {
    self.current.copy();
  }, [self]);
  const download_ = React.useCallback(() => {
    self.current.download();
  }, [self]);
  const trash = React.useCallback(async () => {
    await self.current.trash();
  }, [self]);
  const rename_ = React.useCallback(async (name: string) => {
    await self.current.rename(name);
  }, [self]);
  const showRename = React.useCallback(() => {
    setRenameOpen(true);
  }, [setRenameOpen]);
  const hideRename = React.useCallback(() => {
    setRenameOpen(false);
  }, [setRenameOpen]);
  const showQueue = React.useCallback(() => {
    setQueueOpen(true);
  }, [setQueueOpen]);
  const hideQueue = React.useCallback(() => {
    setQueueOpen(false);
  }, [setQueueOpen]);

  return {
    updating,
    unpacking,
    loadComic: loadComic_,
    copy,
    download: download_,
    rename: rename_,
    trash,
    renameOpen,
    showRename,
    hideRename,
    queueOpen,
    showQueue,
    hideQueue,
    selectedName: self.current.selectedName,
  };
}


function PureContentActionBar(props: IPureProps) {
  const { pendingCount, count, clearSelection } = props;

  const classes = useStyles();
  const {
    updating,
    unpacking,
    loadComic,
    copy,
    download,
    rename,
    trash,
    renameOpen,
    showRename,
    hideRename,
    queueOpen,
    showQueue,
    hideQueue,
    selectedName,
  } = useActions(props);

  return (
    <div className={classes.contentActionBar}>
      <div className={classes.group}>
        <IconButton
          disabled={unpacking || count !== 1}
          onClick={loadComic}
        >
          <ImportContactsIcon />
        </IconButton>
        <Divider />
        <IconButton
          disabled={count <= 0}
          onClick={clearSelection}
        >
          <Badge badgeContent={count} color="secondary">
            <RemoveShoppingCartIcon />
          </Badge>
        </IconButton>
        <Divider />
        <IconButton
          disabled={unpacking || count !== 1}
          onClick={showRename}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          disabled={count <= 0}
          onClick={copy}
        >
          <FileCopyIcon />
        </IconButton>
        <IconButton
          disabled={count <= 0}
          onClick={download}
        >
          <CloudDownloadIcon />
        </IconButton>
        <Divider />
        <IconButton
          onClick={showQueue}
        >
          <Badge badgeContent={pendingCount} color="secondary">
            <ChangeHistoryIcon />
          </Badge>
        </IconButton>
      </div>
      <div className={classes.expand} />
      <div className={classes.group}>
        <IconButton
          color="secondary"
          disabled={updating || count <= 0}
          onClick={trash}
        >
          <DeleteIcon />
        </IconButton>
      </div>
      <RenameDialog
        open={renameOpen}
        onClose={hideRename}
        name={selectedName}
        rename={rename}
      />
      <QueueDialog open={queueOpen} onClose={hideQueue} />
    </div>
  );
}
const MemorizedPureContentActionBar = React.memo(PureContentActionBar);


interface IProps {
  getNode: (id: string) => INodeLike;
}
export function ContentActionBar (props: IProps) {
  const { getNode } = props;
  const { updating } = useFileSystemState();
  const { copyUrl, download, rename } = useFileSystemAction();
  const { trashNodes } = useQueueAction();
  const { pendingCount } = useQueueState();
  const { unpacking } = useComicState();
  const { loadComic } = useComicAction();
  const { count } = useRichSelectableState();
  const { getList, clear } = useRichSelectableAction();
  return (
    <MemorizedPureContentActionBar
      updating={updating}
      copyUrl={copyUrl}
      download={download}
      rename={rename}
      trashNodes={trashNodes}
      pendingCount={pendingCount}
      getNode={getNode}
      unpacking={unpacking}
      loadComic={loadComic}
      count={count}
      getSelectionList={getList}
      clearSelection={clear}
    />
  );
}
