import React from 'react';
import {
  Badge,
  IconButton,
} from '@material-ui/core';
import {
  ChevronLeft as ChevronLeftIcon,
  ImportContacts as ImportContactsIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import {
  useFileSystemAction,
  useFileSystemState,
  Node_,
} from '@/views/hooks/file_system';
import { useComicState, useComicAction } from '@/views/hooks/comic';
import {
  useSimpleSelectable,
} from '@/views/hooks/simple_selectable';
import { useItemCache } from './item_cache';


interface IPureProps {
  root: Node_;
  fileLoading: boolean;
  fileUnpacking: boolean;
  changeRoot: (id: string) => Promise<void>;
  onComic: () => Promise<void>;
  selectedCount: number;
  clearSelection: () => void;
}
function PureToolBar (props: IPureProps) {
  const {
    root,
    fileLoading,
    fileUnpacking,
    changeRoot,
    onComic,
    selectedCount,
    clearSelection,
  } = props;

  const onBack = React.useCallback(async () => {
    if (root.parentId) {
      await changeRoot(root.parentId);
    }
  }, [root, changeRoot]);

  return (
    <>
      <IconButton
        disabled={fileLoading || !root.parentId}
        onClick={onBack}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        disabled={selectedCount === 0}
        onClick={clearSelection}
      >
        <Badge
          badgeContent={selectedCount}
          color="secondary"
        >
          <RemoveShoppingCartIcon />
        </Badge>
      </IconButton>
      <IconButton
        disabled={fileLoading || fileUnpacking || selectedCount !== 1}
        onClick={onComic}
      >
        <ImportContactsIcon />
      </IconButton>
    </>
  );
}
const MemorizedPureToolBar = React.memo(PureToolBar);


interface IProps {
  rootId: string | null;
}
export function ToolBar (props: IProps) {
  const { rootId } = props;

  const { updating, nodes } = useFileSystemState();
  const { getNode } = useFileSystemAction();
  const { unpacking } = useComicState();
  const { loadComic } = useComicAction();
  const { dict, count, clear } = useSimpleSelectable();
  const { changeRoot } = useItemCache();

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

  if (!rootId) {
    return null;
  }

  return (
    <MemorizedPureToolBar
      root={nodes[rootId]}
      fileLoading={updating}
      fileUnpacking={unpacking}
      changeRoot={changeRoot}
      onComic={onComic}
      selectedCount={count}
      clearSelection={clear}
    />
  );
}
