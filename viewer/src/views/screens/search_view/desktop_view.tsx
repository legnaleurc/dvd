import React from 'react';
import { List, ListItem, ListItemText } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins } from '@/lib';
import {
  RichSelectableArea,
  RichSelectableTrigger,
} from '@/views/hooks/rich_selectable';
import { ContentActionBar } from '@/views/widgets/content_action_bar';
import { useContext } from './context';
import { EntryDict } from './types';
import { LoadingBlock, EmptyBlock } from './blocks';


const useStyles = makeStyles((theme) => ({
  disktopView: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'hbox',
    ]),
  },
  head: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'hbox',
    ]),
  },
  toolGroup: {
    ...getMixins([
      'h-100',
    ]),
    width: 200,
  },
  historyList: {
    ...getMixins([
      'w-100',
      'h-100',
      'y-scroll',
    ]),
  },
  tail: {},
  searchResult: {
    ...getMixins([
      'size-grow',
      'y-scroll',
    ]),
    '& .selectable-trigger': {
      ...getMixins([
        'w-100',
      ]),
    },
    '& .selectable-area': {
      ...getMixins([
        'w-100',
        'hbox',
      ]),
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
  },
}));
type Classes = ReturnType<typeof useStyles>;


interface IProps {
}
export function DesktopView (props: IProps) {
  const classes = useStyles();
  const {
    loading,
    list,
    dict,
    openStreamUrl,
    history,
    search,
    getNode,
  } = useContext();
  return (
    <div className={classes.disktopView}>
      <div className={classes.head}>
        <div className={classes.toolGroup}>
          <HistoryList classes={classes} history={history} search={search} />
        </div>
        <div className={classes.searchResult}>
          <ResultList
            loading={loading}
            list={list}
            dict={dict}
            openFileUrl={openStreamUrl}
          />
        </div>
      </div>
      <div className={classes.tail}>
        <ContentActionBar getNode={getNode} />
      </div>
    </div>
  );
}


interface IResultListProps {
  loading: boolean;
  list: string[];
  dict: EntryDict;
  openFileUrl: (id: string) => void;
}
function ResultList (props: IResultListProps) {
  const openFile = React.useCallback((nodeId: string) => {
    const { openFileUrl } = props;
    openFileUrl(nodeId);
  }, [props.openFileUrl]);

  const { loading } = props;
  if (loading) {
    return <LoadingBlock />;
  }

  const { list, dict } = props;
  if (!list || list.length <= 0) {
    return <EmptyBlock />;
  }

  return (
    <List>
      {list.map(id => (
        <ListItem
          key={id}
          dense={true}
          onDoubleClick={event => {
            event.preventDefault();
            openFile(id);
          }}
        >
          <RichSelectableTrigger nodeId={id}>
            <RichSelectableArea nodeId={id}>
              <ListItemText
                primary={dict[id].name}
                secondary={dict[id].path}
              />
            </RichSelectableArea>
          </RichSelectableTrigger>
        </ListItem>
      ))}
    </List>
  );
}


interface IHistoryListPropsType {
  history: string[];
  search: (name: string) => void;
  classes: Classes;
}
function HistoryList (props: IHistoryListPropsType) {
  return (
    <div className={props.classes.historyList}>
      {props.history.map((name, i) => (
        <HistoryEntry
          key={i}
          name={name}
          search={props.search}
        />
      ))}
    </div>
  );
}


interface IHistoryEntryPropsType {
  name: string;
  search: (name: string) => void;
}
function HistoryEntry (props: IHistoryEntryPropsType) {
  return (
    <div
      className="history-entry"
      onClick={event => {
        props.search(props.name);
      }}
    >
      {props.name}
    </div>
  );
}
