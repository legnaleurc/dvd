import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Typography, IconButton, InputBase, Portal } from '@material-ui/core';
import { makeStyles, fade } from '@material-ui/core/styles';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Compare as CompareIcon,
} from '@material-ui/icons';

import { useInstance, getMixins, SELECTION_COLOR } from '@/lib';
import {
  getSearchName,
  compare,
  openStreamUrl,
} from '@/states/search/actions';
import { IGlobalStateType } from '@/states/reducers';
import { postSync } from '@/states/file_system/actions';
import { CompareResult, EntryDict } from '@/states/search/types';
import {
  Selectable,
  SelectableArea,
  SelectableTrigger,
  connectSelection,
  ISelectionStateType,
} from '@/views/hooks/selectable';
import { ContentActionBar } from '@/views/widgets/content_action_bar';


const Context = React.createContext({
  search: (name: string) => {},
});


const useContextStyles = makeStyles((theme) => ({
  selected: {
    backgroundColor: SELECTION_COLOR,
  },
}));


function useActions (props: IContextProviderProps) {
  const [revision, setRevision] = React.useState(0);

  const self = useInstance(() => ({
    search (text: string) {
      const { searchName } = props;
      setRevision(revision + 1);
      searchName(text);
    },
  }), [
    props.searchName,
    revision,
    setRevision,
  ]);

  const getResultList = React.useCallback((id: string) => {
    return props.list;
  }, [props.list]);

  const search = React.useCallback((text: string) => {
    self.current.search(text);
  }, [self]);

  return {
    revision,
    getResultList,
    search,
  };
}


interface IContextProviderProps {
  globalRevision: number;
  searchName: (name: string) => void;
  list: string[];
}
function ContextProvider (props: React.PropsWithChildren<IContextProviderProps>) {
  const classes = useContextStyles();
  const { globalRevision } = props;
  const {
    revision,
    getResultList,
    search,
  } = useActions(props);
  return (
    <Selectable
      getSourceList={getResultList}
      revision={revision + globalRevision}
      classes={classes}
    >
      <Context.Provider value={{
        search,
      }}>
        {props.children}
      </Context.Provider>
    </Selectable>
  );
}
const ConnectedContextProvider = (() => {
  function mapStateToProps (state: IGlobalStateType) {
    const { fileSystem, search } = state;
    return {
      loading: search.loading,
      dict: search.dict,
      list: search.list,
      history: search.history,
      diff: search.diff,
      globalRevision: fileSystem.revision,
    };
  }

  function mapDispatchToProps (dispatch: Dispatch) {
    return {
      searchName (name: string) {
        dispatch(getSearchName(name));
      },
    };
  }

  return connect(mapStateToProps, mapDispatchToProps)(ContextProvider);
})();
export { ConnectedContextProvider as SearchViewContextProvider };


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


interface IPropsType {
  loading: boolean;
  diff: CompareResult[] | null;
  history: string[];
  list: string[];
  dict: EntryDict;

  openFileUrl: (id: string) => void;
}


function SearchView (props: IPropsType) {
  const { diff, history } = props;
  const classes = useStyles();
  const { search } = React.useContext(Context);
  return (
    <div className={classes.searchView}>
      <div className={classes.head}>
        <div className={classes.toolGroup}>
          <CompareList classes={classes} diff={diff} />
          <HistoryList classes={classes} history={history} search={search} />
        </div>
        <div className={classes.searchResult}>
          <ResultList
            loading={props.loading}
            list={props.list}
            dict={props.dict}
            openFileUrl={props.openFileUrl}
          />
        </div>
      </div>
      <div className={classes.tail}>
        <ContentActionBar />
      </div>
    </div>
  );
}
const ConnectedSearchView = (() => {
  function mapStateToProps (state: IGlobalStateType) {
    const { search } = state;
    return {
      loading: search.loading,
      dict: search.dict,
      list: search.list,
      history: search.history,
      diff: search.diff,
    };
  }

  function mapDispatchToProps (dispatch: Dispatch) {
    return {
      openFileUrl (id: string) {
        dispatch(openStreamUrl(id));
      },
    };
  }

  return connect(mapStateToProps, mapDispatchToProps)(SearchView);
})();
export { ConnectedSearchView as SearchView };


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


const useToolBarStyles = makeStyles((theme) => ({
  searchToolBar: {
    ...getMixins([
      'size-grow',
      'hbox',
    ]),
  },
  group: {
    ...getMixins([
      'size-shrink',
      'hbox',
    ]),
    alignItems: 'center',
  },
  expand: {
    ...getMixins([
      'size-grow',
    ]),
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
  icon: {},
}));


function useToolBarActions (
  props: IToolBarProps & IToolBarPrivateProps,
  searchName: (name: string) => void,
) {
  const self = useInstance(() => ({
    compare () {
      const { compare, getSelection } = props;
      compare(getSelection());
    },
  }), [
    props.compare,
  ]);
  const inputRef = React.useRef<HTMLInputElement>();

  const onInputReturn = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !inputRef.current) {
      return;
    }
    event.preventDefault();
    console.info(inputRef.current, inputRef.current.value);
    searchName(inputRef.current.value);
  }, [self, inputRef, searchName]);

  const compare = React.useCallback(() => {
    self.current.compare();
  }, [self]);

  return {
    inputRef,
    onInputReturn,
    compare,
  };
}


interface IToolBarProps {
  anchorEl?: HTMLDivElement;
  updating: boolean;
  sync: () => void;
  compare: (idList: string[]) => void;
}
interface IToolBarPrivateProps {
  getSelection: () => string[];
}
function ToolBar (props: IToolBarProps & IToolBarPrivateProps) {
  const { updating } = props;
  const classes = useToolBarStyles();
  const { search } = React.useContext(Context);
  const {
    inputRef,
    onInputReturn,
    compare,
  } = useToolBarActions(props, search);

  if (!props.anchorEl) {
    return null;
  }

  return (
    <Portal container={props.anchorEl}>
      <div className={classes.searchToolBar}>
        <div className={classes.group}>
          <Typography variant="h6" noWrap>
            Search
          </Typography>
        </div>
        <div className={classes.group}>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder="Search ..."
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'search' }}
              inputRef={inputRef}
              onKeyPress={onInputReturn}
            />
          </div>
        </div>
        <div className={classes.expand} />
        <div className={classes.group}>
          <IconButton
            className={classes.icon}
            onClick={compare}
          >
            <CompareIcon />
          </IconButton>
          <IconButton
            className={classes.icon}
            disabled={updating}
            onClick={props.sync}
          >
            <RefreshIcon />
          </IconButton>
        </div>
      </div>
    </Portal>
  );
}
const ConnectedToolBar = (() => {
  function mapStateToProps (state: IGlobalStateType) {
    return {
      updating: state.fileSystem.updating,
    };
  }

  function mapDispatchToProps (dispatch: Dispatch) {
    return {
      searchName (name: string) {
        dispatch(getSearchName(name));
      },
      compare (idList: string[]) {
        dispatch(compare(idList));
      },
      sync () {
        dispatch(postSync());
      },
    };
  }

  const SelectableToolBar = connectSelection((
    value: ISelectionStateType,
    _ownProps: IToolBarProps,
  ) => ({
    getSelection: value.getList,
  }))(ToolBar);

  return connect(mapStateToProps, mapDispatchToProps)(SelectableToolBar);
})();
export { ConnectedToolBar as SearchViewToolBar };


export { SearchIcon as SearchViewIcon };
