import React from 'react';
import {
  Badge,
  Dialog,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Delete as DeleteIcon,
  History as HistoryIcon,
  ImportContacts as ImportContactsIcon,
  MoreVert as MoreVertIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import { getMixins } from '@/lib';
import { useFileSystemState } from '@/views/hooks/file_system';
import { useQueueAction } from '@/views/hooks/queue';
import { useComicAction } from '@/views/hooks/comic';
import {
  SimpleSelectableProvider,
  useSimpleSelectableAction,
  useSimpleSelectableState,
} from '@/views/hooks/simple_selectable';
import { useMoveListState } from '@/views/hooks/move_list';
import { useContext } from './context';
import { LoadingBlock, EmptyBlock } from './blocks';


const TOOLBAR_HEIGHT = 56;


const useStyles = makeStyles((theme) => ({
  mobileView: {
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
  },
  tail: {
    ...getMixins([
      'w-100',
      'hbox',
    ]),
    height: TOOLBAR_HEIGHT,
    backgroundColor: theme.palette.background.paper,
    boxSizing: 'border-box',
    padding: '0.25rem',
    justifyContent: 'space-between',
  },
  resultList: {
    ...getMixins([
      'y-scroll',
    ]),
  },
}));
type Classes = ReturnType<typeof useStyles>;


interface IProps {
}
export function MobileView (props: IProps) {
  const classes = useStyles();
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const showHistory = React.useCallback(() => {
    setHistoryOpen(true);
  }, [setHistoryOpen]);
  const hideHistory = React.useCallback(() => {
    setHistoryOpen(false);
  }, [setHistoryOpen]);

  return (
    <div className={classes.mobileView}>
      <SimpleSelectableProvider>
        <div className={classes.head}>
          <ContentWrapper classes={classes} />
        </div>
        <div className={classes.tail}>
          <ToolBar showHistory={showHistory} />
        </div>
      </SimpleSelectableProvider>
      <HistoryDialog open={historyOpen} onClose={hideHistory} />
    </div>
  );
}


interface IContentWrapperProps {
  classes: Classes;
}
function ContentWrapper (props: IContentWrapperProps) {
  const { classes } = props;
  const { loading, list } = useContext();

  if (loading) {
    return <LoadingBlock />;
  }

  if (!list || list.length <= 0) {
    return <EmptyBlock />;
  }

  return (
    <div className={classes.resultList}>
      <List>
        {list.map((id) => (
          <ResultItem key={id} nodeId={id} />
        ))}
      </List>
    </div>
  );
}


interface IResultItemProps {
  nodeId: string;
}
function ResultItem (props: IResultItemProps) {
  const { nodeId } = props;
  const { toggle } = useSimpleSelectableAction();
  const { dict: selection } = useSimpleSelectableState();
  const { dict: resultDict } = useContext();

  const onSelect = React.useCallback(() => {
    toggle(nodeId);
  }, [toggle, nodeId]);

  return (
    <ListItem
      selected={selection[nodeId]}
      onClick={onSelect}
    >
      <ListItemText
        primary={resultDict[nodeId].name}
        secondary={resultDict[nodeId].path}
      />
    </ListItem>
  );
}


interface IToolBarProps {
  showHistory: () => void;
}
function ToolBar (props: IToolBarProps) {
  const { showHistory } = props;
  const { syncing } = useFileSystemState();
  const { trashNodes, moveNodesToPath } = useQueueAction();
  const { loadComic } = useComicAction();
  const { clear } = useSimpleSelectableAction();
  const { dict, count } = useSimpleSelectableState();
  const { moveList } = useMoveListState();
  const { getNode } = useContext();
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const onComic = React.useCallback(() => {
    const list = (
      Object.entries(dict)
      .filter(([id, value]) => value)
      .map(([id, value]) => id)
    );
    for (const id of list) {
      const node = getNode(id);
      loadComic(node.id, node.name);
    }
    clear();
  }, [clear, dict, loadComic, getNode]);

  const onTrash = React.useCallback(async () => {
    const list = (
      Object.entries(dict)
      .filter(([id, value]) => value)
      .map(([id, value]) => id)
    );
    await trashNodes(getNode, list);
    clear();
  }, [dict, trashNodes, getNode, clear]);

  const moveTo = React.useCallback(async (destination: string) => {
    const list = (
      Object.entries(dict)
      .filter(([id, value]) => value)
      .map(([id, value]) => id)
    );
    await moveNodesToPath(getNode, list, destination);
    clear();
  }, [dict]);

  const openMenu = React.useCallback(() => {
    setMenuOpen(true);
  }, []);
  const closeMenu = React.useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <>
      <IconButton onClick={showHistory}>
        <HistoryIcon />
      </IconButton>
      <IconButton
        aria-label="trash"
        color="secondary"
        disabled={syncing || count <= 0}
        onClick={onTrash}
      >
        <DeleteIcon />
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
        disabled={syncing || count <= 0}
        onClick={openMenu}
        ref={menuButtonRef}
      >
        <MoreVertIcon />
      </IconButton>
      <IconButton
        disabled={syncing || count <= 0}
        onClick={onComic}
      >
        <ImportContactsIcon />
      </IconButton>

      <Menu
        id="move-list-menu-in-search"
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


interface IHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}
function HistoryDialog (props: IHistoryDialogProps) {
  const { open, onClose } = props;
  const { history } = useContext();

  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <List>
        {history.map((text, index) => (
          <HistoryItem key={index} text={text} />
        ))}
      </List>
    </Dialog>
  );
}


interface IHistoryItem {
  text: string;
}
function HistoryItem (props: IHistoryItem) {
  const { text } = props;
  const { search } = useContext();

  const onClick = React.useCallback(() => {
    search(text);
  }, [text, search]);

  return (
    <ListItem onClick={onClick}>
      <ListItemText primary={text} />
    </ListItem>
  );
}
