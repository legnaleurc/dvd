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
  CreateNewFolder as CreateNewFolderIcon,
} from '@material-ui/icons';

import { INodeLike, getMixins, useInstance } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { useQueueAction, useQueueState } from '@/views/hooks/queue';
import { useComicAction } from '@/views/hooks/comic';
import {
  useRichSelectableAction,
  useRichSelectableState,
} from '@/views/hooks/rich_selectable';
import { RenameDialog } from './rename_dialog';
import { MakeFolderDialog } from './make_folder_dialog';
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
  copyUrl: (idList: string[], getNode: (id: string) => INodeLike) => Promise<void>;
  download: (idList: string[]) => void;
  rename: (id: string, name: string) => Promise<void>;
  mkdir: (name: string, parentId: string) => Promise<void>;
  trashNodes: (getNode: (id: string) => INodeLike, idList: string[]) => Promise<void>;
  pendingCount: number;
  getNode: (id: string) => INodeLike;
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
    mkdir,
    trashNodes,
    getNode,
    loadComic,
    getSelectionList,
    clearSelection,
  } = props;

  const [renameOpen, setRenameOpen] = React.useState(false);
  const [mkdirOpen, setMkdirOpen] = React.useState(false);
  const [queueOpen, setQueueOpen] = React.useState(false);

  const self = useInstance(() => ({
    async loadComic () {
      const list = getSelectionList();
      if (list.length <= 0) {
        return;
      }
      for (const id of list) {
        const node = getNode(id);
        // NOTE no need to wait
        loadComic(node.id, node.name);
      }
      clearSelection();
    },
    copy () {
      const list = getSelectionList();
      copyUrl(list, getNode);
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
    async mkdir (name: string) {
      const parentId = this.selectedParentId;
      if (!parentId) {
        return;
      }
      await mkdir(name, parentId);
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
      if (!node) {
        // It is possible that node has been removed but the selection haven't
        // been cleared yet. Should only happen during state update.
        return '';
      }
      return node.name;
    },
    get selectedParentId () {
      const list = getSelectionList();
      if (list.length !== 1) {
        return '';
      }
      const node = getNode(list[0]);
      if (!node) {
        // It is possible that node has been removed but the selection haven't
        // been cleared yet. Should only happen during state update.
        return '';
      }
      if (node.children) {
        return node.id;
      }
      // not a folder, use its parent
      if (!node.parentId) {
        return ''
      }
      return node.parentId;
    },
    get selectedParentName () {
      const parentId = this.selectedParentId;
      if (!parentId) {
        return '';
      }
      const node = getNode(parentId);
      if (!node) {
        // It is possible that node has been removed but the selection haven't
        // been cleared yet. Should only happen during state update.
        return '';
      }
      return node.name;
    },
  }), [
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
  const mkdir_ = React.useCallback(async (name: string) => {
    await self.current.mkdir(name);
  }, [self]);
  const showRename = React.useCallback(() => {
    setRenameOpen(true);
  }, [setRenameOpen]);
  const hideRename = React.useCallback(() => {
    setRenameOpen(false);
  }, [setRenameOpen]);
  const showMkdir = React.useCallback(() => {
    setMkdirOpen(true);
  }, [setMkdirOpen]);
  const hideMkdir = React.useCallback(() => {
    setMkdirOpen(false);
  }, [setMkdirOpen]);
  const showQueue = React.useCallback(() => {
    setQueueOpen(true);
  }, [setQueueOpen]);
  const hideQueue = React.useCallback(() => {
    setQueueOpen(false);
  }, [setQueueOpen]);

  return {
    updating,
    loadComic: loadComic_,
    copy,
    download: download_,
    rename: rename_,
    mkdir: mkdir_,
    trash,
    renameOpen,
    showRename,
    hideRename,
    mkdirOpen,
    showMkdir,
    hideMkdir,
    queueOpen,
    showQueue,
    hideQueue,
    selectedName: self.current.selectedName,
    selectedParentName: self.current.selectedParentName,
  };
}


function PureContentActionBar(props: IPureProps) {
  const { pendingCount, count, clearSelection } = props;

  const classes = useStyles();
  const {
    updating,
    loadComic,
    copy,
    download,
    rename,
    mkdir,
    trash,
    renameOpen,
    showRename,
    hideRename,
    mkdirOpen,
    showMkdir,
    hideMkdir,
    queueOpen,
    showQueue,
    hideQueue,
    selectedName,
    selectedParentName,
  } = useActions(props);

  return (
    <div className={classes.contentActionBar}>
      <div className={classes.group}>
        <IconButton
          aria-label="load comic"
          disabled={count <= 0}
          onClick={loadComic}
        >
          <ImportContactsIcon />
        </IconButton>
        <Divider />
        <IconButton
          aria-label="clear selection"
          disabled={count <= 0}
          onClick={clearSelection}
        >
          <Badge badgeContent={count} color="secondary">
            <RemoveShoppingCartIcon />
          </Badge>
        </IconButton>
        <Divider />
        <IconButton
          aria-label="rename"
          aria-controls="rename-dialog"
          aria-haspopup="dialog"
          disabled={updating || count !== 1}
          onClick={showRename}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          aria-label="create new folder"
          aria-controls="make-folder-dialog"
          aria-haspopup="dialog"
          disabled={updating || count !== 1}
          onClick={showMkdir}
        >
          <CreateNewFolderIcon />
        </IconButton>
        <Divider />
        <IconButton
          aria-label="copy URL"
          disabled={count <= 0}
          onClick={copy}
        >
          <FileCopyIcon />
        </IconButton>
        <IconButton
          aria-label="download"
          disabled={count <= 0}
          onClick={download}
        >
          <CloudDownloadIcon />
        </IconButton>
        <Divider />
        <IconButton
          aria-label="queue dialog"
          aria-controls="queue-dialog"
          aria-haspopup="dialog"
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
          aria-label="trash"
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
      <MakeFolderDialog
        open={mkdirOpen}
        onClose={hideMkdir}
        name={selectedParentName}
        mkdir={mkdir}
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
  const { copyUrl, download, rename, mkdir } = useFileSystemAction();
  const { trashNodes } = useQueueAction();
  const { pendingCount } = useQueueState();
  const { loadComic } = useComicAction();
  const { count } = useRichSelectableState();
  const { getList, clear } = useRichSelectableAction();
  return (
    <MemorizedPureContentActionBar
      updating={updating}
      copyUrl={copyUrl}
      download={download}
      rename={rename}
      mkdir={mkdir}
      trashNodes={trashNodes}
      pendingCount={pendingCount}
      getNode={getNode}
      loadComic={loadComic}
      count={count}
      getSelectionList={getList}
      clearSelection={clear}
    />
  );
}
