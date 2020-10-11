import React from 'react';
import { Badge, Divider, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  FileCopy as FileCopyIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  ImportContacts as ImportContactsIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import { getMixins, useInstance } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
  IFileNode,
} from '@/views/hooks/file_system';
import { useComicState, useComicAction } from '@/views/hooks/comic';
import {
  useRichSelectableAction,
  useRichSelectableState,
} from '@/views/hooks/rich_selectable';


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
  trashNodes: (idList: string[]) => Promise<void>;
  getNode: (id: string) => IFileNode;
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
    trashNodes,
    getNode,
    unpacking,
    loadComic,
    getSelectionList,
    clearSelection,
  } = props;
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
    trash () {
      const list = getSelectionList();
      trashNodes(list);
    },
  }), [
    unpacking,
    getSelectionList,
    clearSelection,
    loadComic,
    copyUrl,
    download,
    trashNodes,
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
  const trash = React.useCallback(() => {
    self.current.trash();
  }, [self]);

  return {
    updating,
    unpacking,
    loadComic: loadComic_,
    copy,
    download: download_,
    trash,
  };
}


function PureContentActionBar(props: IPureProps) {
  const { count, clearSelection } = props;

  const classes = useStyles();
  const {
    updating,
    unpacking,
    loadComic,
    copy,
    download,
    trash,
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
    </div>
  );
}
const MemorizedPureContentActionBar = React.memo(PureContentActionBar);


interface IProps {
  getNode: (id: string) => IFileNode;
}
export function ContentActionBar (props: IProps) {
  const { getNode } = props;
  const { updating } = useFileSystemState();
  const { copyUrl, download, trashNodes } = useFileSystemAction();
  const { unpacking } = useComicState();
  const { loadComic } = useComicAction();
  const { count } = useRichSelectableState();
  const { getList, clear } = useRichSelectableAction();
  return (
    <MemorizedPureContentActionBar
      updating={updating}
      copyUrl={copyUrl}
      download={download}
      trashNodes={trashNodes}
      getNode={getNode}
      unpacking={unpacking}
      loadComic={loadComic}
      count={count}
      getSelectionList={getList}
      clearSelection={clear}
    />
  );
}
