import React from 'react';


interface IActionType {
  type: 'TOGGLE';
}
interface IStateType {
  two: boolean;
}
function reducer (state: IStateType, action: IActionType) {
  switch (action.type) {
    case 'TOGGLE':
      return {
        ...state,
        two: !state.two,
      };
    default:
      return state;
  }
}


const Context = React.createContext({
  two: false,
  toggle: () => {},
});


export function useContext () {
  const state = React.useContext(Context);
  return state;
}


export const ContextProvider: React.FC<{}> = (props) => {
  const [state, dispatch] = React.useReducer(reducer, {
    two: false,
  });
  const toggle = React.useCallback(() => {
    dispatch({
      type: 'TOGGLE',
    });
  }, [dispatch]);
  const value = React.useMemo(() => ({
    two: state.two,
    toggle,
  }), [state.two, toggle]);
  return (
    <Context.Provider value={value}>
      {props.children}
    </Context.Provider>
  );
};
