import React from 'react';

import { useInstance } from '@/lib';
import { ISelectionClasses, Selection } from './types';
import { useReducer } from './reducer';


interface IStateContext {
  dict: Selection;
  count: number;
  classes: ISelectionClasses;
}
const StateContext = React.createContext<IStateContext | null>(null);
interface IActionContext {
  toggle: (id: string) => void;
  selectFromLast: (id: string) => void;
  getList: () => string[];
  clear: () => void;
}
const ActionContext = React.createContext<IActionContext | null>(null);


interface IProps {
  revision: number;
  getSourceList: (id: string) => string[] | null;
  classes: ISelectionClasses;
}
export const RichSelectableProvider: React.FC<IProps> = (props) => {
  const {
    dict,
    count,
    toggle,
    clear,
    getList,
    selectFromLast,
  } = useActions(props);

  return (
    <ActionContext.Provider
      value={{
        toggle,
        selectFromLast,
        getList,
        clear,
      }}
    >
      <StateContext.Provider
        value={{
          classes: props.classes,
          dict,
          count,
        }}
      >
        {props.children}
      </StateContext.Provider>
    </ActionContext.Provider>
  );
};


export function useRichSelectableState () {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error('rich selectable context not ready');
  }
  return context;
}


export function useRichSelectableAction () {
  const context = React.useContext(ActionContext);
  if (!context) {
    throw new Error('rich selectable context not ready');
  }
  return context;
}


function useActions (props: IProps) {
  const [state, dispatch] = useReducer();
  const self = useInstance(() => ({
    getList () {
      return Object.keys(state.dict);
    },
    getSourceList (id: string) {
      return props.getSourceList(id);
    }
  }), [props.getSourceList, state.dict, state.last]);

  const toggle = React.useCallback((id: string) => {
    dispatch({
      type: 'TOGGLE',
      value: id,
    });
  }, [dispatch]);

  const clear = React.useCallback(() => {
    dispatch({
      type: 'CLEAR',
      value: null,
    });
  }, [dispatch]);

  const getList = React.useCallback(() => {
    return self.current.getList();
  }, [self]);

  const selectFromLast = React.useCallback((id: string) => {
    const sourceList = self.current.getSourceList(id);
    dispatch({
      type: 'SELECT_FROM_LAST',
      value: {
        id,
        sourceList,
      },
    });
  }, [self, dispatch]);

  React.useEffect(() => {
    clear();
  }, [props.revision]);

  return {
    dict: state.dict,
    count: state.count,
    toggle,
    clear,
    getList,
    selectFromLast,
  };
}
