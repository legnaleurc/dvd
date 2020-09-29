import React from 'react';


interface IContext {
  dict: Record<string, boolean>;
  count: number;
  toggle: (id: string) => void;
  clear: () => void;
}
const Context = React.createContext<IContext>({
  dict: {},
  count: 0,
  toggle: (id: string) => {},
  clear: () => {},
});


export function SimpleSelectable (props: React.PropsWithChildren<{}>) {
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

  return (
    <Context.Provider
      value={{
        dict: state.dict,
        count: state.count,
        toggle,
        clear,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}


export function useSimpleSelectable () {
  return React.useContext(Context);
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
