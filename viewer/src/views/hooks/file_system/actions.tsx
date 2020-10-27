import React from 'react';

import { useInstance, getActionList } from '@/lib';
import { useGlobal } from '@/views/hooks/global';
import { useReducer } from './reducer';
import { SortKey, INodeLike } from './types';


export function useActions () {
  const { fileSystem } = useGlobal();
  const [state, dispatch] = useReducer();
  const self = useInstance(() => ({
    async sync () {
      if (state.updating) {
        return;
      }
      dispatch({
        type: 'REQUEST_BEGIN',
        value: null,
      });
      try {
        const changeList = await fileSystem.sync();
        dispatch({
          type: 'SYNC_END',
          value: changeList,
        });
      } catch (e) {
        dispatch({
          type: 'ERROR',
          value: e,
        });
      }
    },
    async loadRoot () {
      if (state.updating) {
        return;
      }
      dispatch({
        type: 'REQUEST_BEGIN',
        value: null,
      });
      try {
        const node = await fileSystem.root();
        const children = await fileSystem.list(node.id);
        dispatch({
          type: 'LOAD_ROOT_END',
          value: {
            rawNode: node,
            children,
          },
        });
      } catch (e) {
        dispatch({
          type: 'ERROR',
          value: e,
        });
      }
    },
    async loadList (id: string) {
      if (state.updating) {
        return;
      }
      dispatch({
        type: 'REQUEST_BEGIN',
        value: null,
      });
      try {
        const children = await fileSystem.list(id);
        dispatch({
          type: 'LOAD_LIST_END',
          value: {
            id,
            children,
          },
        });
      } catch (e) {
        dispatch({
          type: 'ERROR',
          value: e,
        });
      }
    },
    async rename (id: string, name: string) {
      if (state.updating) {
        return;
      }
      dispatch({
        type: 'REQUEST_BEGIN',
        value: null,
      });
      try {
        await fileSystem.rename(id, name);
        const changeList = await fileSystem.sync();
        dispatch({
          type: 'SYNC_END',
          value: changeList,
        });
      } catch (e) {
        dispatch({
          type: 'ERROR',
          value: e,
        });
      }
    },
    setSortKey (key: SortKey) {
      dispatch({
        type: 'SORT',
        value: key,
      });
    },
    async copyUrl (idList: string[]) {
      const urlList = idList.map((id) => (
        fileSystem.stream(id, state.nodes[id].name
      )));
      const content = urlList.join('\n');
      await window.navigator.clipboard.writeText(content);
    },
    download (idList: string[]) {
      for (const id of idList) {
        const url = fileSystem.download(id);
        window.open(url, '_blank');
      }
    },
    async openUrl (node: INodeLike) {
      if (!node || !node.mimeType) {
        return;
      }
      const actionList = getActionList();
      if (!actionList) {
        // has no action
        return;
      }
      const [category, __] = node.mimeType.split('/');
      const command = actionList[category];
      if (!command) {
        // no command to run
        return;
      }
      const url = fileSystem.stream(node.id, node.name);
      await fileSystem.apply(command, {
        url,
      });
    },
    getNode (id: string) {
      return state.nodes[id];
    },
  }), [fileSystem, dispatch, state.updating, state.nodes]);

  const sync = React.useCallback(async () => {
    await self.current.sync();
  }, [self]);
  const loadRoot = React.useCallback(async () => {
    await self.current.loadRoot();
  }, [self]);
  const loadList = React.useCallback(async (id: string) => {
    await self.current.loadList(id);
  }, [self]);
  const rename = React.useCallback(async (id: string, name: string) => {
    await self.current.rename(id, name);
  }, [self]);
  const setSortKey = React.useCallback((key: SortKey) => {
    self.current.setSortKey(key);
  }, [self]);
  const copyUrl = React.useCallback(async (idList: string[]) => {
    await self.current.copyUrl(idList);
  }, [self]);
  const download = React.useCallback((idList: string[]) => {
    self.current.download(idList);
  }, [self]);
  const openUrl = React.useCallback(async (node: INodeLike) => {
    await self.current.openUrl(node);
  }, [self]);
  const getNode = React.useCallback((id: string) => {
    return self.current.getNode(id);
  }, [self]);

  return {
    state,
    sync,
    loadRoot,
    loadList,
    rename,
    setSortKey,
    copyUrl,
    download,
    openUrl,
    getNode,
  };
}
