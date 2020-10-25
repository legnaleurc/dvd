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

import {
  useFileSystemState,
  Node_,
} from '@/views/hooks/file_system';
import { useSimpleSelectable } from '@/views/hooks/simple_selectable';


interface IPureProps {
  node: Node_;
  isLast: boolean;
  style: React.CSSProperties;
  itemRef: (element: Element | null) => void;
  changeRoot: (id: string) => Promise<void>;
  selected: boolean;
  toggle: (id: string) => void;
}
function PureItemView (props: IPureProps) {
  const {
    isLast,
    itemRef,
    node,
    style,
    changeRoot,
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
        switchId={changeRoot}
      />
    );
  }
}
const MemorizedPureItemView = React.memo(PureItemView);


interface IProps {
  nodeId: string;
  changeRoot: (id: string) => Promise<void>;
  isLast: boolean;
  style: React.CSSProperties;
  itemRef: (element: Element | null) => void;
}
export function ItemView (props: IProps) {
  const {
    isLast,
    itemRef,
    nodeId,
    changeRoot,
    style,
  } = props;

  const { nodes } = useFileSystemState();
  const { dict, toggle } = useSimpleSelectable();

  return (
    <MemorizedPureItemView
      node={nodes[nodeId]}
      itemRef={itemRef}
      style={style}
      isLast={isLast}
      changeRoot={changeRoot}
      selected={dict[nodeId]}
      toggle={toggle}
    />
  );
}


interface IItemProps {
  node: Node_;
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
