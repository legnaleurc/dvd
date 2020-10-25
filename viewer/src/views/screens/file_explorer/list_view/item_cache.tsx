import React from 'react';

import { useInstance } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { useSimpleSelectableAction } from '@/views/hooks/simple_selectable';
import { useLayoutCache } from './layout_cache';


interface IContext {
  changeRoot: (id: string) => Promise<void>;
}
const Context = React.createContext<IContext | null>(null);


interface IPureProvider {
  setRootId: (id: string) => void;
}
type IProvider = React.PropsWithChildren<IPureProvider>;
export function ItemCacheProvider (props: IProvider) {
  const { setRootId } = props;

  const { loadList } = useFileSystemAction();
  const { nodes } = useFileSystemState();
  const { clear } = useSimpleSelectableAction();
  const { cache } = useLayoutCache();

  const self = useInstance(() => ({
    getNode (id: string) {
      return nodes[id];
    },
  }), [nodes]);

  const changeRoot = React.useCallback(async (id: string) => {
    clear();
    cache.clearAll();
    setRootId(id);
    const node = self.current.getNode(id);
    if (!node.fetched) {
      await loadList(id);
    }
  }, [clear, loadList, setRootId, cache, self]);

  const value = React.useMemo(() => ({
    changeRoot,
  }), [changeRoot]);

  return (
    <Context.Provider value={value}>
      {props.children}
    </Context.Provider>
  );
}


export function useItemCache () {
  const context = React.useContext(Context);
  if (!context) {
    throw new Error('item cache context not ready');
  }
  return context;
}
