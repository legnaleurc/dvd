import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Search as SearchIcon } from '@material-ui/icons';

import { getMixins } from '@/lib';
import {
  RichSelectableArea,
  RichSelectableTrigger,
} from '@/views/hooks/rich_selectable';
import { ContentActionBar } from '@/views/widgets/content_action_bar';
import { useContext } from './hooks';
import { EntryDict } from './types';
import { CompareDialog } from './compare_dialog';


const useStyles = makeStyles((theme) => ({
  searchView: {
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
  },
}));
type Classes = ReturnType<typeof useStyles>;


export function SearchView (props: {}) {
  const classes = useStyles();
  const {
    loading,
    list,
    dict,
    openStreamUrl,
    history,
    search,
    showCompareDialog,
    hideCompare,
    getNode,
  } = useContext();
  return (
    <div className={classes.searchView}>
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
      <CompareDialog
        open={showCompareDialog}
        onClose={hideCompare}
      />
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
    <>
      {list.map(id => (
        <div
          key={id}
          onDoubleClick={event => {
            event.preventDefault();
            openFile(id);
          }}
        >
          <RichSelectableArea nodeId={id}>
            <RichSelectableTrigger nodeId={id}>
              <code>{dict[id].path}</code>
            </RichSelectableTrigger>
          </RichSelectableArea>
        </div>
      ))}
    </>
  );
}


function LoadingBlock (props: {}) {
  return <div className="loading-block">SEARCHING</div>;
}


function EmptyBlock (props: {}) {
  return (
    <div className="empty-block">EMPTY</div>
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
    <pre
      className="history-entry"
      onClick={event => {
        props.search(props.name);
      }}
    >
      {props.name}
    </pre>
  );
}


export { SearchIcon as SearchViewIcon };
