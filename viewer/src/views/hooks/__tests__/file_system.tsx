import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';

import { ChangeResponse, FileSystem, INodeLike, NodeResponse } from '@/lib';
import { GlobalProvider } from '@/views/hooks/global';
import {
  FileSystemProvider,
  SORT_BY_MTIME_ASC,
  SORT_BY_MTIME_DES,
  SORT_BY_NAME_ASC,
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { newFileSystem } from '@/lib/mocks';


describe('file_system', () => {

  describe('<FileSystemProvider />', () => {

    type IActionContext = ReturnType<typeof useFileSystemAction>;

    interface IRoot {
      fileSystem: FileSystem;
    }
    const Root: React.FC<IRoot> = ({ children, fileSystem }) => {
      return (
        <GlobalProvider fileSystem={fileSystem}>
          <FileSystemProvider>
            {children}
          </FileSystemProvider>
        </GlobalProvider>
      );
    }

    function renderFileSystemHook (fileSystem: FileSystem) {
      return renderHook(() => ({
        state: useFileSystemState(),
        action: useFileSystemAction(),
      }), {
        wrapper: Root,
        initialProps: {
          fileSystem,
        },
      });
    }

    function makeNode (node: Partial<NodeResponse>): NodeResponse {
      return node as NodeResponse;
    }

    function fakeSync (
      actions: IActionContext,
      fileSystem: FileSystem,
      changeList: ChangeResponse[],
    ) {
      const mfs = jest.mocked(fileSystem);
      mfs.sync.mockResolvedValueOnce(changeList);
      act(() => {
        actions.sync();
      });
    }

    function fakeLoadRoot (
      actions: IActionContext,
      fileSystem: FileSystem,
      rootId: string,
      children: Partial<NodeResponse>[],
    ) {
      const mfs = jest.mocked(fileSystem);
      mfs.root.mockResolvedValueOnce(makeNode({
        id: rootId,
        parent_list: [],
      }));
      mfs.list.mockResolvedValueOnce(children.map(makeNode));
      act(() => {
        actions.loadRoot();
      });
    }

    function fakeLoadList (
      actions: IActionContext,
      fileSystem: FileSystem,
      id: string,
      children: Partial<NodeResponse>[],
    ) {
      const mfs = jest.mocked(fileSystem);
      mfs.list.mockResolvedValueOnce(children.map(makeNode));
      act(() => {
        actions.loadList(id);
      });
    }

    function fakeRename (
      actions: IActionContext,
      fileSystem: FileSystem,
      id: string,
      name: string,
      parentId: string,
    ) {
      const mfs = jest.mocked(fileSystem);
      mfs.rename.mockResolvedValueOnce();
      mfs.sync.mockResolvedValueOnce([
        { removed: false, node: makeNode({ id, name, parent_list: [parentId] }) },
      ]);
      act(() => {
        actions.rename(id, name);
      });
    }

    function fakeMkdir (
      actions: IActionContext,
      fileSystem: FileSystem,
      name: string,
      parentId: string,
      newId: string,
    ) {
      const mfs = jest.mocked(fileSystem);
      mfs.mkdir.mockResolvedValueOnce();
      mfs.sync.mockResolvedValueOnce([
        { removed: false, node: makeNode({ id: newId, name, parent_list: [parentId] }) },
      ]);
      act(() => {
        actions.mkdir(name, parentId);
      });
    }

    function fakeDownload (
      actions: IActionContext,
      fileSystem: FileSystem,
      idList: string[],
    ) {
      const mfs = jest.mocked(fileSystem);
      mfs.download.mockImplementationOnce((id: string) => id);
      const fakeOpen = jest.spyOn(window, 'open').mockReturnValueOnce(null);
      act(() => {
        actions.download(idList);
      });
      return fakeOpen;
    }

    function fakeCopyUrl (
      actions: IActionContext,
      fileSystem: FileSystem,
      idList: string[],
    ) {
      const mfs = jest.mocked(fileSystem);
      mfs.stream.mockImplementationOnce((id: string) => id);
      const fakeWriteText = jest.fn();
      fakeWriteText.mockResolvedValueOnce(null);
      Object.defineProperty(window.navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: fakeWriteText,
        },
      });
      act(() => {
        actions.copyUrl(idList, actions.getNode);
      });
      return fakeWriteText;
    }

    async function fakeOpenUrl (
      actions: IActionContext,
      fileSystem: FileSystem,
      node: INodeLike,
    ) {
      const mfs = jest.mocked(fileSystem);
      mfs.apply.mockResolvedValueOnce();
      mfs.stream.mockImplementationOnce((id: string, name: string) => `${id}:${name}`);

      const actionList = {
        video: 'vlc',
      };
      localStorage.setItem('actionList', JSON.stringify(actionList));

      await act(async () => {
        await actions.openUrl(node);
      });
      return {
        cleanUp () {
          localStorage.clear();
        },
      };
    }

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('has good initial state', () => {
      const fileSystem = newFileSystem();
      const { result } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      const state = result.current.state;
      expect(state.syncing).toBeFalsy();
      expect(state.rootId).toBeNull();
      expect(state.sortKey).toBe(SORT_BY_MTIME_DES);
      expect(state.revision).toBe(0);
      expect(state.nodes).toMatchObject({});

      expect(result.current.action).toMatchObject(actions);
    });

    it('sync', async () => {
      const fileSystem = newFileSystem();
      const { result, waitForNextUpdate } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      fakeSync(result.current.action, fileSystem, [
        { removed: false, node: makeNode({ id: '2', parent_list: ['1'] }) },
        { removed: false, node: makeNode({ id: '3', parent_list: ['1'] }) },
      ]);
      expect(result.current.state.syncing).toBeTruthy();
      expect(result.current.state.revision).toBe(0);

      await waitForNextUpdate();
      expect(result.current.state.syncing).toBeFalsy();
      expect(result.current.state.revision).toBe(1);
      expect(Object.keys(result.current.state.nodes)).toHaveLength(2);

      fakeSync(result.current.action, fileSystem, [
        {
          removed: false,
          node: makeNode({
            id: '2',
            parent_list: ['1'],
            trashed: true,
          }),
        },
      ]);
      expect(result.current.state.syncing).toBeTruthy();
      expect(result.current.state.revision).toBe(1);

      await waitForNextUpdate();
      expect(result.current.state.syncing).toBeFalsy();
      expect(result.current.state.revision).toBe(2);
      expect(Object.keys(result.current.state.nodes)).toHaveLength(1);

      fakeSync(result.current.action, fileSystem, [
        { removed: true, id: '3' },
      ]);
      expect(result.current.state.syncing).toBeTruthy();
      expect(result.current.state.revision).toBe(2);

      await waitForNextUpdate();
      expect(result.current.state.syncing).toBeFalsy();
      expect(result.current.state.revision).toBe(3);
      expect(Object.keys(result.current.state.nodes)).toHaveLength(0);

      expect(result.current.action).toMatchObject(actions);
    });

    it('loadRoot', async () => {
      const fileSystem = newFileSystem();
      const { result, waitForNextUpdate } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      fakeLoadRoot(result.current.action, fileSystem, '1', []);
      expect(result.current.state.syncing).toBeTruthy();
      expect(result.current.state.revision).toBe(0);
      expect(result.current.state.rootId).toBeNull();

      await waitForNextUpdate();
      expect(result.current.state.syncing).toBeFalsy();
      expect(fileSystem.list).toHaveBeenLastCalledWith('1');
      expect(result.current.state.revision).toBe(1);
      expect(result.current.state.rootId).toBe('1');
      expect(Object.keys(result.current.state.nodes)).toHaveLength(1);

      expect(result.current.action).toMatchObject(actions);
    });

    it('loadList', async () => {
      const fileSystem = newFileSystem();
      const { result, waitForNextUpdate } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      fakeLoadRoot(result.current.action, fileSystem, '1', [
        {
          id: '2',
          parent_list: ['1'],
        },
      ]);
      await waitForNextUpdate();

      fakeLoadList(result.current.action, fileSystem, '2', [
        {
          id: '3',
          parent_list: ['2'],
        },
      ]);
      expect(result.current.state.syncing).toBeFalsy();
      expect(result.current.state.revision).toBe(1);
      expect(Object.keys(result.current.state.nodes)).toHaveLength(2);

      await waitForNextUpdate();
      expect(result.current.state.syncing).toBeFalsy();
      expect(result.current.state.revision).toBe(1);
      expect(Object.keys(result.current.state.nodes)).toHaveLength(3);

      expect(result.current.action).toMatchObject(actions);
    });

    it('rename', async () => {
      const fileSystem = newFileSystem();
      const { result, waitForNextUpdate } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      fakeLoadRoot(result.current.action, fileSystem, '1', [
        {
          id: '2',
          name: 'foo',
          parent_list: ['1'],
          is_folder: true,
        },
      ]);
      await waitForNextUpdate();
      fakeLoadList(result.current.action, fileSystem, '2', [
        {
          id: '3',
          parent_list: ['2'],
        },
      ]);
      await waitForNextUpdate();

      fakeRename(result.current.action, fileSystem, '2', 'bar', '1');
      expect(result.current.state.syncing).toBeTruthy();
      expect(result.current.state.nodes['2'].name).toBe('foo');
      expect(result.current.state.nodes['2'].children?.length).toBe(1);

      await waitForNextUpdate();
      expect(result.current.state.syncing).toBeFalsy();
      expect(fileSystem.rename).toHaveBeenLastCalledWith('2', 'bar');
      expect(result.current.state.nodes['2'].name).toBe('bar');
      expect(result.current.state.nodes['2'].children?.length).toBe(1);

      expect(result.current.action).toMatchObject(actions);
    });

    it('mkdir', async () => {
      const fileSystem = newFileSystem();
      const { result, waitForNextUpdate } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      fakeLoadRoot(result.current.action, fileSystem, '1', [
        {
          id: '2',
          name: 'foo',
          parent_list: ['1'],
        },
      ]);
      await waitForNextUpdate();

      fakeMkdir(result.current.action, fileSystem, 'bar', '1', '3');
      expect(result.current.state.syncing).toBeTruthy();
      expect(result.current.state.nodes['2'].name).toBe('foo');

      await waitForNextUpdate();
      expect(result.current.state.syncing).toBeFalsy();
      expect(fileSystem.mkdir).toHaveBeenLastCalledWith('bar', '1');
      expect(result.current.state.nodes['3'].name).toBe('bar');

      expect(result.current.action).toMatchObject(actions);
    });

    it('download', () => {
      const fileSystem = newFileSystem();
      const { result } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      const fakeOpen = fakeDownload(result.current.action, fileSystem, ['2']);
      expect(fakeOpen).toHaveBeenCalledWith('2', '_blank');

      expect(result.current.action).toMatchObject(actions);
    });

    it('copyUrl', async () => {
      const fileSystem = newFileSystem();
      const { result, waitForNextUpdate } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      fakeLoadRoot(result.current.action, fileSystem, '1', [
        {
          id: '2',
          name: 'foo',
          parent_list: ['1'],
        },
      ]);
      await waitForNextUpdate();

      const fakeWriteText = fakeCopyUrl(result.current.action, fileSystem, ['2']);
      expect(fakeWriteText).toHaveBeenCalledWith('2');

      expect(result.current.action).toMatchObject(actions);
    });

    it('openUrl', async () => {
      const fileSystem = newFileSystem();
      const { result } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      const { cleanUp } = await fakeOpenUrl(result.current.action, fileSystem, {
        id: '2',
        name: 'foo',
        mimeType: 'video/mp4',
        parentId: '1',
        children: null,
      });
      expect(fileSystem.apply).toHaveBeenCalledTimes(1);
      expect(fileSystem.apply).toHaveBeenCalledWith('vlc', {
        url: `2:foo`,
      });

      cleanUp();

      expect(result.current.action).toMatchObject(actions);
    });

    it('setSortKey', async () => {
      const fileSystem = newFileSystem();
      const { result, waitForNextUpdate } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;

      fakeLoadRoot(result.current.action, fileSystem, '1', [
        { id: '2', name: 'two', modified: '2', parent_list: ['1'] },
        { id: '3', name: 'three', modified: '3', parent_list: ['1'] },
        { id: '4', name: 'four', modified: '4', parent_list: ['1'] },
        { id: '5', name: 'five', modified: '2', parent_list: ['1'] },
        { id: '6', name: 'six', modified: '3', parent_list: ['1'] },
        { id: '7', name: 'seven', modified: '4', parent_list: ['1'] },
        { id: '77', name: 'seven', modified: '5', parent_list: ['1'] },
      ]);
      await waitForNextUpdate();

      act(() => {
        result.current.action.setSortKey(SORT_BY_MTIME_ASC);
      });
      expect(result.current.state.sortKey).toBe(SORT_BY_MTIME_ASC);

      act(() => {
        result.current.action.setSortKey(SORT_BY_NAME_ASC);
      });
      expect(result.current.state.sortKey).toBe(SORT_BY_NAME_ASC);

      expect(result.current.action).toMatchObject(actions);
    });

    it('getNode', async () => {
      const fileSystem = newFileSystem();
      const { result, waitForNextUpdate } = renderFileSystemHook(fileSystem);
      const actions = result.current.action;


      fakeLoadRoot(result.current.action, fileSystem, '1', [
        {
          id: '2',
          name: 'foo',
          parent_list: ['1'],
        },
      ]);
      await waitForNextUpdate();

      const node = result.current.action.getNode('2');
      expect(node.name).toBe('foo');

      expect(result.current.action).toMatchObject(actions);
    });

  });

});
