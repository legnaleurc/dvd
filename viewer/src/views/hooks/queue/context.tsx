import React from 'react';

import { useGlobal } from '@/views/hooks/global';
import { useFileSystemAction } from '@/views/hooks/file_system';
import { GetNode } from './types';
import { useReducer } from './reducer';
import { ActionQueue } from './queue';


interface IActionContext {
  moveNodes: (getNode: GetNode, srcList: string[], dst: string) => Promise<void>;
  trashNodes: (getNode: GetNode, idList: string[]) => Promise<void>;
}
const ActionContext = React.createContext<IActionContext | null>(null);
interface IStateContext {
  nameList: string[];
  pendingCount: number;
  resolvedCount: number;
  rejectedCount: number;
}
const StateContext = React.createContext<IStateContext | null>(null);


export function QueueProvider (props: React.PropsWithChildren<{}>) {
  const { state, moveNodes, trashNodes } = useActions();
  const actionValue = React.useMemo(() => ({
    moveNodes,
    trashNodes,
  }), [moveNodes, trashNodes]);
  const stateValue = React.useMemo(() => ({
    nameList: state.nameList,
    pendingCount: state.pendingCount,
    resolvedCount: state.resolvedCount,
    rejectedCount: state.rejectedCount,
  }), [
    state.nameList,
    state.pendingCount,
    state.resolvedCount,
    state.rejectedCount,
  ]);
  return (
    <ActionContext.Provider value={actionValue}>
      <StateContext.Provider value={stateValue}>
        {props.children}
      </StateContext.Provider>
    </ActionContext.Provider>
  );
}


export function useQueueAction () {
  const context = React.useContext(ActionContext);
  if (!context) {
    throw new Error('queue context is not ready');
  }
  return context;
}


export function useQueueState () {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error('queue context is not ready');
  }
  return context;
}


function useActions () {
  const { fileSystem } = useGlobal();
  const { sync } = useFileSystemAction();
  const [state, dispatch] = useReducer();
  const actionQueue = React.useMemo(() => (
    new ActionQueue(fileSystem, sync, dispatch)
  ), [fileSystem, sync, dispatch]);

  const moveNodes = React.useCallback(async (
    getNode: GetNode,
    srcList: string[],
    dst: string,
  ) => {
    await actionQueue.moveNodes(srcList.map(getNode), getNode(dst));
  }, [actionQueue]);

  const trashNodes = React.useCallback(async (
    getNode: GetNode,
    idList: string[],
  ) => {
    await actionQueue.trashNodes(idList.map(getNode));
  }, [actionQueue]);

  React.useEffect(() => {
    actionQueue.start();
    return () => {
      actionQueue.stop()
    };
  }, [actionQueue]);

  return {
    moveNodes,
    trashNodes,
    state,
  };
}
