import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Search as SearchIcon } from '@material-ui/icons';

import { getMixins } from '@/lib';
import { SelectableArea, SelectableTrigger } from '@/views/hooks/selectable';
import { ContentActionBar } from '@/views/widgets/content_action_bar';
import { useContext } from './hooks';
import { CompareResult, EntryDict } from './types';


const useStyles = makeStyles((theme) => ({
  searchView: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'hbox',
    ]),
    '& $head': {
      ...getMixins([
        'size-grow',
        'mh-0',
        'hbox',
      ]),
      '& $toolGroup': {
        ...getMixins([
          'h-100',
        ]),
        width: 200,
        '& $compareList': {
          ...getMixins([
            'w-100',
            'y-scroll',
          ]),
          height: '20%',
        },
        '& $historyList': {
          ...getMixins([
            'w-100',
            'y-scroll',
          ]),
          height: '80%',
        },
      },
      '& $searchResult': {
        ...getMixins([
          'size-grow',
          'y-scroll',
        ]),
      },
    },
  },
  head: {},
  tail: {},
  toolGroup: {},
  compareList: {},
  historyList: {},
  searchResult: {},
}));
type Classes = ReturnType<typeof useStyles>;


export function SearchView (props: {}) {
  const classes = useStyles();
  const {
    loading,
    list,
    dict,
    openStreamUrl,
    diff,
    history,
    search,
  } = useContext();
  return (
    <div className={classes.searchView}>
      <div className={classes.head}>
        <div className={classes.toolGroup}>
          <CompareList classes={classes} diff={diff} />
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
        <ContentActionBar />
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
    <>
      {list.map(id => (
        <div
          key={id}
          onDoubleClick={event => {
            event.preventDefault();
            openFile(id);
          }}
        >
          <SelectableArea nodeId={id}>
            <SelectableTrigger nodeId={id}>
              <code>{dict[id].path}</code>
            </SelectableTrigger>
          </SelectableArea>
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


interface ICompareListProps {
  diff: CompareResult[] | null;
  classes: Classes;
}
function CompareList (props: ICompareListProps) {
  return (
    <div className={props.classes.compareList}>
      <InnerCompareList diff={props.diff} />
    </div>
  );
}


function InnerCompareList (props: { diff: CompareResult[] | null }): JSX.Element {
  if (!props.diff) {
    return <React.Fragment />;
  }
  if (props.diff.length <= 0) {
    return <>OK</>;
  }
  return (
    <>
      {props.diff.map(({path, size}, i) => (
        <pre key={i}>
          {`${size}: ${path}`}
        </pre>
      ))}
    </>
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
