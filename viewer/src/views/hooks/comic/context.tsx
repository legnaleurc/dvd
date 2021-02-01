import React from 'react';

import { useInstance } from '@/lib';
import { useGlobal } from '@/views/hooks/global';
import { ComicDict, ActionType } from './types';


interface IStateContext {
  idList: string[];
  comicDict: ComicDict;
}
const StateContext = React.createContext<IStateContext | null>(null);
interface IActionContext {
  loadComic: (id: string, name: string) => Promise<void>;
  loadCache: () => Promise<void>;
  clearCache: () => Promise<void>;
}
const ActionContext = React.createContext<IActionContext | null>(null);


export const ComicProvider: React.FC<{}> = (props) => {
  const { state, loadComic, loadCache, clearCache } = useActions();
  const dispatchValue = React.useMemo(() => ({
    loadComic,
    loadCache,
    clearCache,
  }), [loadComic, loadCache, clearCache]);
  const stateValue = React.useMemo(() => ({
    idList: state.idList,
    comicDict: state.comicDict,
  }), [state]);
  return (
    <ActionContext.Provider value={dispatchValue}>
      <StateContext.Provider value={stateValue}>
        {props.children}
      </StateContext.Provider>
    </ActionContext.Provider>
  );
};


export function useComicState () {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error('comic context is not ready');
  }
  return context;
}


export function useComicAction () {
  const context = React.useContext(ActionContext);
  if (!context) {
    throw new Error('comic context is not ready');
  }
  return context;
}


function reduce (state: IStateContext, action: ActionType) {
  switch (action.type) {
    case 'ERROR_WITH_ID': {
      const { id } = action.value;
      const { comicDict } = state;
      const dict = comicDict[id];
      comicDict[id] = {
        ...dict,
        unpacking: false,
        imageList: [],
      };
      return {
        ...state,
        comicDict: { ...comicDict },
      };
    }
    case 'LOAD_BEGIN': {
      const { id, name } = action.value;
      const { idList, comicDict } = state;
      if (idList.indexOf(id) < 0) {
        idList.push(id);
      }
      comicDict[id] = {
        name,
        unpacking: true,
        imageList: [],
      };
      return {
        ...state,
        idList: [...idList],
        comicDict: { ...comicDict },
      };
    }
    case 'LOAD_END': {
      const { id, imageList } = action.value;
      const { comicDict } = state;
      const dict = comicDict[id];
      comicDict[id] = {
        ...dict,
        unpacking: false,
        imageList,
      };
      return {
        ...state,
        comicDict: { ...comicDict },
      };
    }
    case 'LOAD_CACHE_END': {
      const cacheList = action.value;
      const { comicDict, idList } = state;
      for (const cache of cacheList) {
        // skip existing record
        if (comicDict[cache.id]) {
          continue;
        }
        idList.push(cache.id);
        comicDict[cache.id] = {
          name: cache.name,
          unpacking: false,
          imageList: cache.imageList,
        }
      }
      return {
        ...state,
        idList: [...idList],
        comicDict: { ...comicDict },
      };
    }
    case 'CLEAR_CACHE_END':
      return {
        idList: [],
        comicDict: {},
      };
    default:
      return state;
  }
}


function useActions () {
  const { fileSystem } = useGlobal();

  const [state, dispatch] = React.useReducer(reduce, {
    idList: [],
    comicDict: {},
  });

  const self = useInstance(() => ({
    isUnpacking (id: string) {
      if (!state.comicDict[id]) {
        return false;
      }
      const data = state.comicDict[id];
      return data.unpacking;
    },
    get idList () {
      return state.idList;
    },
    getName (id: string) {
      return state.comicDict[id].name;
    },
  }), [state.comicDict, state.idList]);

  const loadComic = React.useCallback(async (id: string, name: string) => {
    if (self.current.isUnpacking(id)) {
      return;
    }

    dispatch({
      type: 'LOAD_BEGIN',
      value: {
        id,
        name,
      },
    });
    try {
      const imageList = await fileSystem.imageList(id);
      const imageDataList = imageList.map((data, index) => {
        const url = fileSystem.image(id, index);
        return {
          ...data,
          url,
        };
      });
      dispatch({
        type: 'LOAD_END',
        value: {
          id,
          imageList: imageDataList,
        },
      });
    } catch (e) {
      dispatch({
        type: 'ERROR_WITH_ID',
        value: {
          id,
          error: e,
        },
      });
    }
  }, [fileSystem, dispatch, self]);

  const loadCache = React.useCallback(async () => {
    dispatch({
      type: 'LOAD_CACHE_BEGIN',
      value: null,
    });

    for (const id of self.current.idList) {
      loadComic(id, self.current.getName(id));
    }

    try {
      const cacheList = await fileSystem.fetchCache();
      dispatch({
        type: 'LOAD_CACHE_END',
        value: cacheList.map((m) => ({
          id: m.id,
          name: m.name,
          imageList: m.image_list.map((n, i) => ({
            ...n,
            url: fileSystem.image(m.id, i),
          })),
        })),
      });
    } catch (e) {
      dispatch({
        type: 'ERROR',
        value: {
          error: e,
        },
      });
    }
  }, [fileSystem, dispatch, self, loadComic]);

  const clearCache = React.useCallback(async () => {
    dispatch({
      type: 'CLEAR_CACHE_BEGIN',
      value: null,
    });
    try {
      await fileSystem.clearCache();
      dispatch({
        type: 'CLEAR_CACHE_END',
        value: null,
      });
    } catch (e) {
      dispatch({
        type: 'ERROR',
        value: {
          error: e,
        },
      });
    }
  }, [fileSystem, dispatch]);


  return {
    state,
    loadComic,
    loadCache,
    clearCache,
  };
};
