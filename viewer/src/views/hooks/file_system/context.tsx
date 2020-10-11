import React from 'react';

import { useActions } from './actions';
import { SortKey, NodeDict, Node, IFileNode } from './types';


interface IStateContext {
  updating: boolean;
  nodes: NodeDict;
  rootId: string | null;
  sortKey: SortKey;
  // denotes the changes from the database point of view
  revision: number;
}
const StateContext = React.createContext<IStateContext | null>(null);
interface IActionContext {
  sync: () => Promise<void>;
  loadRoot: () => Promise<void>;
  loadList: (id: string) => Promise<void>;
  moveNodes: (srcList: string[], dst: string) => Promise<void>;
  trashNodes: (idList: string[]) => Promise<void>;
  setSortKey: (key: SortKey) => void;
  copyUrl: (idList: string[]) => Promise<void>;
  download: (idList: string[]) => void;
  openUrl: (node: IFileNode) => Promise<void>;
  getNode: (id: string) => Node;
}
const ActionContext = React.createContext<IActionContext | null>(null);


export function FileSystemProvider (props: React.PropsWithChildren<{}>) {
  const {
    state,
    sync,
    loadRoot,
    loadList,
    moveNodes,
    trashNodes,
    setSortKey,
    copyUrl,
    download,
    openUrl,
    getNode,
  } = useActions();
  const actionValue = React.useMemo(() => ({
    sync,
    loadRoot,
    loadList,
    moveNodes,
    trashNodes,
    setSortKey,
    copyUrl,
    download,
    openUrl,
    getNode,
  }), [
    sync,
    loadRoot,
    loadList,
    moveNodes,
    trashNodes,
    setSortKey,
    copyUrl,
    download,
    openUrl,
    getNode,
  ]);
  const stateValue = React.useMemo(() => ({
    updating: state.updating,
    nodes: state.nodes,
    rootId: state.rootId,
    sortKey: state.sortKey,
    revision: state.revision,
  }), [state]);
  return (
    <ActionContext.Provider value={actionValue}>
      <StateContext.Provider value={stateValue}>
        {props.children}
      </StateContext.Provider>
    </ActionContext.Provider>
  );
}


export function useFileSystemState () {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error('file system context is not ready');
  }
  return context;
}


export function useFileSystemAction () {
  const context = React.useContext(ActionContext);
  if (!context) {
    throw new Error('file system context is not ready');
  }
  return context;
}
