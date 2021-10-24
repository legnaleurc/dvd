import React from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
} from '@material-ui/core';
import {
  ChevronLeft as ChevronLeftIcon,
  Delete as DeleteIcon,
  ImportContacts as ImportContactsIcon,
  MoreVert as MoreVertIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import { loadMoveList } from '@/lib';
import { useQueueAction } from '@/views/hooks/queue';
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
  onTrash: () => void;
  moveTo: (destintation: string) => void;
  selectedCount: number;
  clearSelection: () => void;
}
function PureToolBar (props: IPureProps) {
  const {
    root,
    syncing,
    changeRoot,
    onComic,
    onTrash,
    moveTo,
    selectedCount,
    clearSelection,
  } = props;
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [moveList, setMoveList] = React.useState<string[]>([]);

  const onBack = React.useCallback(async () => {
    if (root.parentId) {
      await changeRoot(root.parentId);
    }
  }, [root, changeRoot]);

  const openMenu = React.useCallback(() => {
    setMenuOpen(true);
  }, []);
  const closeMenu = React.useCallback(() => {
    setMenuOpen(false);
  }, []);

  React.useEffect(() => {
    setMoveList(loadMoveList());
  }, []);

  return (
    <>
      <IconButton
        disabled={syncing || !root.parentId}
        onClick={onBack}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        aria-label="trash"
        color="secondary"
        disabled={syncing || selectedCount <= 0}
        onClick={onTrash}
      >
        <DeleteIcon />
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
        onClick={openMenu}
        ref={menuButtonRef}
      >
        <MoreVertIcon />
      </IconButton>
      <IconButton
        disabled={syncing || selectedCount <= 0}
        onClick={onComic}
      >
        <ImportContactsIcon />
      </IconButton>

      <Menu
        id="move-list-menu-in-explorer"
        open={menuOpen}
        keepMounted={true}
        anchorEl={menuButtonRef.current}
        onClose={closeMenu}
      >
        {moveList.map((destination, index) => (
          <MenuItem
            key={index}
            value={index}
            onClick={() => {
              closeMenu();
              moveTo(destination);
            }}
          >
            {destination}
          </MenuItem>
        ))}
        <MenuItem disabled={true}>Move Selected Items</MenuItem>
      </Menu>
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
  const { trashNodes, moveNodesToPath } = useQueueAction();

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

  const onTrash = React.useCallback(async () => {
    const list = (
      Object.entries(dict)
      .filter(([id, value]) => value)
      .map(([id, value]) => id)
    );
    await trashNodes(getNode, list);
    clear();
  }, [dict]);

  const moveTo = React.useCallback(async (destination: string) => {
    const list = (
      Object.entries(dict)
      .filter(([id, value]) => value)
      .map(([id, value]) => id)
    );
    await moveNodesToPath(getNode, list, destination);
    clear();
  }, [dict]);

  if (!rootId) {
    return null;
  }

  return (
    <MemorizedPureToolBar
      root={nodes[rootId]}
      syncing={syncing}
      changeRoot={changeRoot}
      onComic={onComic}
      onTrash={onTrash}
      moveTo={moveTo}
      selectedCount={count}
      clearSelection={clear}
    />
  );
}
