import React from 'react';
import {
  Badge,
  Dialog,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  History as HistoryIcon,
  ImportContacts as ImportContactsIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import { getMixins } from '@/lib';
import { useFileSystemState } from '@/views/hooks/file_system';
import { useComicState, useComicAction } from '@/views/hooks/comic';
import {
  SimpleSelectable,
  useSimpleSelectable,
} from '@/views/hooks/simple_selectable';
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
    position: 'fixed',
    height: TOOLBAR_HEIGHT,
    bottom: 0,
    backgroundColor: theme.palette.background.paper,
    boxSizing: 'border-box',
    padding: '0.25rem',
    justifyContent: 'space-between',
  },
  resultList: {
    ...getMixins([
      // 'size-grow',
      // 'mh-0',
      'y-scroll',
    ]),
  },
  fakeToolBar: {
    height: TOOLBAR_HEIGHT,
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
      <SimpleSelectable>
        <div className={classes.head}>
          <ContentWrapper classes={classes} />
        </div>
        <div className={classes.tail}>
          <ToolBar showHistory={showHistory} />
        </div>
      </SimpleSelectable>
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
      <div className={classes.fakeToolBar} />
    </div>
  );
}


interface IResultItemProps {
  nodeId: string;
}
function ResultItem (props: IResultItemProps) {
  const { nodeId } = props;
  const { dict: selection, toggle } = useSimpleSelectable();
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
        primary={resultDict[nodeId].path}
      />
    </ListItem>
  );
}


interface IToolBarProps {
  showHistory: () => void;
}
function ToolBar (props: IToolBarProps) {
  const { showHistory } = props;
  const { updating: fileLoading } = useFileSystemState();
  const { unpacking: fileUnpacking } = useComicState();
  const { loadComic } = useComicAction();
  const { dict, count, clear } = useSimpleSelectable();
  const { getNode } = useContext();

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
  }, [clear, dict, loadComic, getNode]);

  return (
    <>
      <IconButton onClick={showHistory}>
        <HistoryIcon />
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
