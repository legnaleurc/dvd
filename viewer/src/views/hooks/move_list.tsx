import React from 'react';

import { saveMoveList, loadMoveList } from '@/lib/storage';


interface IStateContext {
  moveList: string[];
}
const StateContext = React.createContext<IStateContext | null>(null);
interface IActionContext {
  setMoveList: (moveList: string[]) => void;
}
const ActionContext = React.createContext<IActionContext | null>(null);


export const MoveListProvider: React.FC<{}> = (props) => {
  const [moveList, setMoveList] = React.useState<string[]>([]);

  const setMoveList_ = React.useCallback((list: string[]) => {
    saveMoveList(list);
    setMoveList(list);
  }, []);

  const actionValue = React.useMemo(() => ({
    setMoveList: setMoveList_,
  }), []);
  const stateValue = React.useMemo(() => ({
    moveList,
  }), [moveList]);

  React.useEffect(() => {
    const list = loadMoveList();
    setMoveList(list);
  }, []);

  return (
    <ActionContext.Provider value={actionValue}>
      <StateContext.Provider value={stateValue}>
        {props.children}
      </StateContext.Provider>
    </ActionContext.Provider>
  );
};


export function useMoveListState () {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error('move list context is not ready');
  }
  return context;
}


export function useMoveListAction () {
  const context = React.useContext(ActionContext);
  if (!context) {
    throw new Error('move list context is not ready');
  }
  return context;
}
