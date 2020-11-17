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
import { useComicAction } from '@/views/hooks/comic';
import {
  useSimpleSelectableAction,
  useSimpleSelectableState,
} from '@/views/hooks/simple_selectable';
import { useItemCache } from './item_cache';


interface IPureProps {
  root: Node_;
  syncing: boolean;
  changeRoot: (id: string) => Promise<void>;
  onComic: () => void;
  selectedCount: number;
  clearSelection: () => void;
}
function PureToolBar (props: IPureProps) {
  const {
    root,
    syncing,
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
        disabled={syncing || !root.parentId}
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
        disabled={syncing || selectedCount <= 0}
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

  const { syncing, nodes } = useFileSystemState();
  const { getNode } = useFileSystemAction();
  const { loadComic } = useComicAction();
  const { clear } = useSimpleSelectableAction();
  const { dict, count } = useSimpleSelectableState();
  const { changeRoot } = useItemCache();

  const onComic = React.useCallback(() => {
    const list = (
      Object.entries(dict)
      .filter(([id, value]) => value)
      .map(([id, value]) => id)
    );
    if (list.length <= 0) {
      return;
    }
    for (const id of list) {
      const node = getNode(id);
      loadComic(node.id, node.name);
    }
    clear();
  }, [clear, dict, loadComic]);

  if (!rootId) {
    return null;
  }

  return (
    <MemorizedPureToolBar
      root={nodes[rootId]}
      syncing={syncing}
      changeRoot={changeRoot}
      onComic={onComic}
      selectedCount={count}
      clearSelection={clear}
    />
  );
}
