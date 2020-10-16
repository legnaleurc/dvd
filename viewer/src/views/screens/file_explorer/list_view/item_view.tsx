import React from 'react';
import {
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from '@material-ui/core';
import {
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
} from '@material-ui/icons';

import { useInstance } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
  Node,
} from '@/views/hooks/file_system';
import { useSimpleSelectable } from '@/views/hooks/simple_selectable';
import { useLayoutCache } from './layout_cache';


interface IPureProps {
  node: Node;
  isLast: boolean;
  style: React.CSSProperties;
  itemRef: (element: Element | null) => void;
  switchId: (id: string) => Promise<void>;
  selected: boolean;
  toggle: (id: string) => void;
}
function PureItemView (props: IPureProps) {
  const {
    isLast,
    itemRef,
    node,
    style,
    switchId,
    selected,
    toggle,
  } = props;

  if (!node.children) {
    return (
      <FileItem
        node={node}
        toggle={toggle}
        selected={selected}
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
        selected={selected}
        style={style}
        itemRef={itemRef}
        isLast={isLast}
        switchId={switchId}
      />
    );
  }
}
const MemorizedPureItemView = React.memo(PureItemView);


interface IProps {
  nodeId: string;
  setRootId: (id: string) => void;
  isLast: boolean;
  style: React.CSSProperties;
  itemRef: (element: Element | null) => void;
}
export function ItemView (props: IProps) {
  const {
    isLast,
    itemRef,
    nodeId,
    setRootId,
    style,
  } = props;

  const { loadList } = useFileSystemAction();
  const { nodes } = useFileSystemState();
  const { dict, toggle, clear } = useSimpleSelectable();
  const { cache } = useLayoutCache();

  const self = useInstance(() => ({
    getNode (id: string) {
      return nodes[id];
    },
  }), [nodes]);

  const switchId = React.useCallback(async (id: string) => {
    clear();
    cache.clearAll();
    setRootId(id);
    const node = self.current.getNode(id);
    if (!node.fetched) {
      await loadList(id);
    }
  }, [clear, loadList, setRootId, cache, self]);

  return (
    <MemorizedPureItemView
      node={nodes[nodeId]}
      itemRef={itemRef}
      style={style}
      isLast={isLast}
      switchId={switchId}
      selected={dict[nodeId]}
      toggle={toggle}
    />
  );
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
  switchId: (id: string) => Promise<void>;
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
  const onOpenFolder = React.useCallback(async () => {
    await switchId(node.id);
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
