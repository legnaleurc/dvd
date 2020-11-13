import React from 'react';


interface IStateContext {
  dict: Record<string, boolean>;
  count: number;
}
const StateContext = React.createContext<IStateContext | null>(null);
interface IActionContext {
  toggle: (id: string) => void;
  clear: () => void;
}
const ActionContext = React.createContext<IActionContext | null>(null);


export const SimpleSelectableProvider: React.FC<{}> = (props) => {
  const [state, dispatch] = React.useReducer(reduce, {
    dict: {},
    count: 0,
  });

  const toggle = React.useCallback((id: string) => {
    dispatch({
      type: 'TOGGLE',
      value: id,
    });
  }, [dispatch]);
  const clear = React.useCallback(() => {
    dispatch({
      type: 'CLEAR',
      value: '',
    });
  }, [dispatch]);

  const actionValue = React.useMemo(() => ({
    toggle,
    clear,
  }), [toggle, clear]);
  const stateValue = React.useMemo(() => ({
    dict: state.dict,
    count: state.count,
  }), [state. dict, state.count]);

  return (
    <ActionContext.Provider value={actionValue}>
      <StateContext.Provider value={stateValue}>
        {props.children}
      </StateContext.Provider>
    </ActionContext.Provider>
  );
};


export function useSimpleSelectableState () {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error('simple selectable is not ready');
  }
  return context;
}


export function useSimpleSelectableAction () {
  const context = React.useContext(ActionContext);
  if (!context) {
    throw new Error('simple selectable is not ready');
  }
  return context;
}


interface IState {
  dict: Record<string, boolean>;
  count: number;
}
interface IAction {
  type: 'TOGGLE' | 'CLEAR';
  value: string;
}
function reduce (state: IState, action: IAction) {
  switch (action.type) {
    case 'TOGGLE':
      if (state.dict[action.value]) {
        delete state.dict[action.value];
        return {
          ...state,
          dict: {
            ...state.dict,
          },
          count: state.count - 1,
        };
      } else {
        return {
          ...state,
          dict: {
            ...state.dict,
            [action.value]: true,
          },
          count: state.count + 1,
        };
      }
    case 'CLEAR':
      return {
        ...state,
        dict: {},
        count: 0,
      };
    default:
      return state;
  }
}
