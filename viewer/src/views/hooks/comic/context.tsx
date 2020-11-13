import React from 'react';

import { useInstance } from '@/lib';
import { useGlobal } from '@/views/hooks/global';
import { ImageData, ActionType } from './types';


interface IStateContext {
  name: string;
  imageList: ImageData[];
  unpacking: boolean;
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
    name: state.name,
    imageList: state.imageList,
    unpacking: state.unpacking,
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


interface IState {
  name: string;
  imageList: ImageData[];
  unpacking: boolean;
}
function reduce (state: IState, action: ActionType) {
  switch (action.type) {
    case 'ERROR':
      return {
        ...state,
        unpacking: false,
        name: '',
        imageList: [],
      };
    case 'LOAD_BEGIN':
      return {
        ...state,
        unpacking: true,
        name: action.value,
        imageList: [],
      };
    case 'LOAD_END':
      return {
        ...state,
        unpacking: false,
        imageList: action.value,
      };
    default:
      return state;
  }
}


function useActions () {
  const { fileSystem } = useGlobal();
  const [state, dispatch] = React.useReducer(reduce, {
    name: '',
    imageList: [],
    unpacking: false,
  });
  const self = useInstance(() => ({
    get unpacking () {
      return state.unpacking;
    },
  }), [state.unpacking]);
  const loadComic = React.useCallback(async (id: string, name: string) => {
    if (self.current.unpacking) {
      return;
    }

    dispatch({
      type: 'LOAD_BEGIN',
      value: name,
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
        value: imageDataList,
      });
    } catch (e) {
      dispatch({
        type: 'ERROR',
        value: e,
      });
    }
  }, [fileSystem, dispatch, self]);

  return {
    state,
    loadComic,
  };
};
