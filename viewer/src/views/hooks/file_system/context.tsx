import React from 'react';

import { useActions } from './actions';
import { SortKey, NodeDict, Node_, INodeLike } from './types';


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
  rename: (id: string, name: string) => Promise<void>;
  mkdir: (name: string, parentId: string) => Promise<void>;
  setSortKey: (key: SortKey) => void;
  copyUrl: (idList: string[]) => Promise<void>;
  download: (idList: string[]) => void;
  openUrl: (node: INodeLike) => Promise<void>;
  getNode: (id: string) => Node_;
}
const ActionContext = React.createContext<IActionContext | null>(null);


export function FileSystemProvider (props: React.PropsWithChildren<{}>) {
  const {
    state,
    sync,
    loadRoot,
    loadList,
    rename,
    mkdir,
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
    rename,
    mkdir,
    setSortKey,
    copyUrl,
    download,
    openUrl,
    getNode,
  }), [
    sync,
    loadRoot,
    loadList,
    rename,
    mkdir,
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
