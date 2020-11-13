import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { SELECTION_COLOR, useInstance } from '@/lib';
import { useGlobal } from '@/views/hooks/global';
import {
  INodeLike,
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { RichSelectableProvider } from '@/views/hooks/rich_selectable';
import { EntryDict } from './types';
import { useReducer } from './reducer';


interface IContext {
  search: (name: string) => void;
  openStreamUrl: (id: string) => Promise<void>;
  showCompare: (idList: string[]) => void;
  hideCompare: () => void;
  getNode: (id: string) => INodeLike;
  loading: boolean;
  dict: EntryDict;
  list: string[];
  history: string[];
  showCompareDialog: boolean;
  compareList: string[];
  identical: boolean;
}
const Context = React.createContext<IContext | null>(null);


const useStyles = makeStyles((theme) => ({
  selected: {
    backgroundColor: SELECTION_COLOR,
  },
}));


function useActions () {
  const { fileSystem } = useGlobal();
  const { openUrl } = useFileSystemAction();
  const [state, dispatch] = useReducer();

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

  const showCompare = React.useCallback((idList: string[]) => {
    dispatch({
      type: 'COMPARE_SHOW',
      value: idList,
    });
  }, [dispatch]);

  const hideCompare = React.useCallback(() => {
    dispatch({
      type: 'COMPARE_HIDE',
      value: null,
    });
  }, [dispatch]);

  const openStreamUrl = React.useCallback(async (id: string) => {
    const dict = self.current.dict;
    const node = dict[id];
    await openUrl(node);
  }, [self]);

  const getNode = React.useCallback((id: string): INodeLike => {
    const dict = self.current.dict;
    return dict[id];
  }, [self]);

  return {
    state,
    showCompare,
    hideCompare,
    getResultList,
    openStreamUrl,
    search,
    getNode,
  };
}


export function useContext () {
  const context = React.useContext(Context);
  if (!context) {
    throw new Error('search context not ready');
  }
  return context;
}


export const ContextProvider: React.FC<{}> = (props) => {
  const { revision: globalRevision } = useFileSystemState();
  const classes = useStyles();
  const {
    state,
    showCompare,
    hideCompare,
    getResultList,
    openStreamUrl,
    search,
    getNode,
  } = useActions();
  return (
    <Context.Provider
      value={{
        showCompare,
        hideCompare,
        openStreamUrl,
        search,
        getNode,
        loading: state.loading,
        dict: state.dict,
        list: state.list,
        history: state.history,
        showCompareDialog: state.showCompareDialog,
        compareList: state.compareList,
        identical: state.identical,
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
};
