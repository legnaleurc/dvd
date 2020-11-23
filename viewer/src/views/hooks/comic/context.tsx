import React from 'react';

import { useInstance } from '@/lib';
import { useGlobal } from '@/views/hooks/global';
import { ImageData, ActionType } from './types';


interface IComicUnit {
  name: string;
  imageList: ImageData[];
  unpacking: boolean;
}
interface IStateContext {
  idList: string[];
  comicDict: Record<string, IComicUnit>;
}
const StateContext = React.createContext<IStateContext | null>(null);
interface IActionContext {
  loadComic: (id: string, name: string) => Promise<void>;
}
const ActionContext = React.createContext<IActionContext | null>(null);


export const ComicProvider: React.FC<{}> = (props) => {
  const { state, loadComic } = useActions();
  const dispatchValue = React.useMemo(() => ({
    loadComic,
  }), [loadComic]);
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
    case 'ERROR': {
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
  }), [state.comicDict]);

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
        type: 'ERROR',
        value: {
          id,
          error: e,
        },
      });
    }
  }, [fileSystem, dispatch, self]);

  return {
    state,
    loadComic,
  };
};
