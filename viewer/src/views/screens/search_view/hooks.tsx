import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import {
  SELECTION_COLOR,
  SearchResponse,
  getActionList,
  useInstance,
} from '@/lib';
import { useGlobal } from '@/views/hooks/global';
import { useFileSystemState } from '@/views/hooks/file_system';
import { RichSelectableProvider } from '@/views/hooks/rich_selectable';
import {
  SearchState,
  ActionType,
  EntryDict,
  Entry,
  CompareResult,
} from './types';


function reduce (state: SearchState, action: ActionType) {
  switch (action.type) {
    case 'ERROR':
      return {
        ...state,
        loading: false,
        dict: {},
        list: [],
      };
    case 'SEARCH_BEGIN': {
      if (state.loading) {
        return state;
      }
      const name = action.value;
      const history = state.history.filter(e => e !== name);
      history.unshift(name);
      return {
        ...state,
        loading: true,
        dict: {},
        list: [],
        history,
        revision: state.revision + 1,
      };
    }
    case 'SEARCH_END': {
      const pathList = action.value;
      const dict: EntryDict = {};
      const list: string[] = [];
      for (const entry of pathList) {
        dict[entry.id] = createEntry(entry);
        list.push(entry.id);
      }
      return {
        ...state,
        loading: false,
        dict,
        list,
        revision: state.revision + 1,
      };
    }
    case 'COMPARE': {
      const idList = action.value;
      if (idList.length <= 0) {
        return state;
      }
      const dict = state.dict;
      const hashList = idList.map(id => dict[id].hash);
      const rv = hashList.slice(1).every(hash => hash === hashList[0]);
      if (rv) {
        return {
          ...state,
          diff: [],
        };
      }
      const sizeList: CompareResult[] = idList.map(id => ({
        path: dict[id].path,
        size: dict[id].size,
      }));
      return {
        ...state,
        diff: sizeList,
      };
    }
    default:
      return state;
  }
}


function createEntry (entry: SearchResponse): Entry {
  return {
    id: entry.id,
    name: entry.name,
    hash: entry.hash,
    size: entry.size,
    mimeType: entry.mime_type,
    path: entry.path,
  };
}


interface IContext {
  search: (name: string) => void;
  openStreamUrl: (id: string) => Promise<void>;
  compare: (idList: string[]) => void;
  loading: boolean;
  dict: EntryDict;
  list: string[];
  history: string[];
  diff: CompareResult[] | null;
}
const Context = React.createContext<IContext>({
  search: (name: string) => {},
  openStreamUrl: async (id: string) => {},
  compare: (idList: string[]) => {},
  loading: false,
  dict: {},
  list: [],
  history: [],
  diff: null,
});


const useStyles = makeStyles((theme) => ({
  selected: {
    backgroundColor: SELECTION_COLOR,
  },
}));


function useActions () {
  const { fileSystem } = useGlobal();
  const [state, dispatch] = React.useReducer(reduce, {
    loading: false,
    revision: 0,
    dict: {},
    list: [],
    history: [],
    diff: null,
  });

  const self = useInstance(() => ({
    get loading () {
      return state.loading;
    },
    get list () {
      return state.list;
    },
    get dict () {
      return state.dict;
    },
  }), [
    state.loading,
    state.list,
    state.dict,
  ]);

  const getResultList = React.useCallback((id: string) => {
    return self.current.list;
  }, [self]);

  const search = React.useCallback(async (text: string) => {
    if (self.current.loading) {
      return;
    }
    dispatch({
      type: 'SEARCH_BEGIN',
      value: text,
    });
    try {
      const result = await fileSystem.searchByName(text);
      dispatch({
        type: 'SEARCH_END',
        value: result,
      });
    } catch (e) {
      dispatch({
        type: 'ERROR',
        value: e,
      })
    }
  }, [self, dispatch, fileSystem]);

  const compare = React.useCallback((idList: string[]) => {
    dispatch({
      type: 'COMPARE',
      value: idList,
    });
  }, [dispatch]);

  const openStreamUrl = React.useCallback(async (id: string) => {
    const dict = self.current.dict;
    const node = dict[id];
    if (!node || !node.mimeType) {
      return;
    }
    const actionList = getActionList();
    if (!actionList) {
      // has no action
      return;
    }
    const [category, __] = node.mimeType.split('/');
    const command = actionList[category];
    if (!command) {
      // no command to run
      return;
    }
    const url = fileSystem.stream(id, node.name);
    await fileSystem.apply(command, {
      url,
    });
  }, [fileSystem, self]);

  return {
    state,
    compare,
    getResultList,
    openStreamUrl,
    search,
  };
}


export function useContext () {
  return React.useContext(Context);
}


export function ContextProvider (props: React.PropsWithChildren<{}>) {
  const { revision: globalRevision } = useFileSystemState();
  const classes = useStyles();
  const {
    state,
    compare,
    getResultList,
    openStreamUrl,
    search,
  } = useActions();
  return (
    <Context.Provider
      value={{
        compare,
        openStreamUrl,
        search,
        loading: state.loading,
        dict: state.dict,
        list: state.list,
        history: state.history,
        diff: state.diff,
      }}
    >
      <RichSelectableProvider
        getSourceList={getResultList}
        revision={state.revision + globalRevision}
        classes={classes}
      >
        {props.children}
      </RichSelectableProvider>
    </Context.Provider>
  );
}
