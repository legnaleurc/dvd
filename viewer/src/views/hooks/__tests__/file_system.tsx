import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mocked } from 'ts-jest/utils';

import { ChangeResponse, FileSystem, INodeLike, NodeResponse } from '@/lib';
import { GlobalProvider } from '@/views/hooks/global';
import {
  FileSystemProvider,
  SortKey,
  SORT_BY_MTIME_ASC,
  SORT_BY_MTIME_DES,
  SORT_BY_NAME_ASC,
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { makeEventHandler, newFileSystem } from '@/lib/mocks';


describe('file_system', () => {

  describe('<FileSystemProvider />', () => {

    function Root (props: { fileSystem: FileSystem, actionStub: () => void }) {
      const [node, setNode] = React.useState<null | INodeLike>(null);
      return (
        <GlobalProvider fileSystem={props.fileSystem}>
          <FileSystemProvider>
            <Action stub={props.actionStub} setNode={setNode} />
            <State node={node} />
          </FileSystemProvider>
        </GlobalProvider>
      );
    }

    function Action (props: { stub: () => void; setNode: (node: INodeLike) => void }) {
      const {
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
      } = useFileSystemAction();

      React.useEffect(() => {
        props.stub();
      }, [
        props.stub,
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

      const onLoadList = makeEventHandler(async (event) => {
        await loadList(event.currentTarget.dataset['id']!);
      }, [loadList]);

      const onRename = makeEventHandler(async (event) => {
        const data = event.currentTarget.dataset;
        await rename(data['id']!, data['name']!);
      }, [rename]);

      const onMkdir = makeEventHandler(async (event) => {
        const data = event.currentTarget.dataset;
        await mkdir(data['name']!, data['parentId']!);
      }, [mkdir]);

      const onDownload = makeEventHandler((event) => {
        const data = event.currentTarget.dataset;
        const idList: string[] = JSON.parse(data['idList']!);
        download(idList);
      }, [download]);

      const onCopyUrl = makeEventHandler(async (event) => {
        const data = event.currentTarget.dataset;
        const idList: string[] = JSON.parse(data['idList']!);
        await copyUrl(idList, getNode);
      }, [copyUrl, getNode]);

      const onOpenUrl = makeEventHandler(async (event) => {
        const data = event.currentTarget.dataset;
        const node: INodeLike = JSON.parse(data['node']!);
        await openUrl(node);
      }, [openUrl]);

      const onSetSortKey = makeEventHandler((event) => {
        const data = event.currentTarget.dataset;
        const sortKey = data['sortKey']! as SortKey;
        setSortKey(sortKey);
      }, [setSortKey]);

      const onGetNode = makeEventHandler((event) => {
        const data = event.currentTarget.dataset;
        const node = getNode(data['id']!);
        props.setNode(node);
      }, [getNode, props.setNode]);

      return (
        <>
          <button aria-label="sync" onClick={sync} />
          <button aria-label="loadRoot" onClick={loadRoot} />
          <button aria-label="loadList" onClick={onLoadList} />
          <button aria-label="rename" onClick={onRename} />
          <button aria-label="mkdir" onClick={onMkdir} />
          <button aria-label="download" onClick={onDownload} />
          <button aria-label="copyUrl" onClick={onCopyUrl} />
          <button aria-label="openUrl" onClick={onOpenUrl} />
          <button aria-label="setSortKey" onClick={onSetSortKey} />
          <button aria-label="getNode" onClick={onGetNode} />
        </>
      );
    }

    function State (props: { node: INodeLike | null }) {
      const {
        updating,
        nodes,
        rootId,
        sortKey,
        revision,
      } = useFileSystemState();
      return (
        <>
          <input type="checkbox" aria-label="updating" readOnly={true} checked={updating} />
          <input type="checkbox" aria-label="no-root" readOnly={true} checked={rootId === null} />
          <input type="text" aria-label="root-id" readOnly={true} value={rootId || ''} />
          <input type="text" aria-label="sort-key" readOnly={true} value={sortKey} />
          <input type="number" readOnly={true} value={revision} />
          <ul>
            {Object.keys(nodes).map((id) => (
              <li key={id} data-testid={id}>{nodes[id].name}</li>
            ))}
          </ul>
          <input type="checkbox" aria-label="no-node" readOnly={true} checked={props.node === null} />
        </>
      );
    }

    function makeNode (node: Partial<NodeResponse>): NodeResponse {
      return node as NodeResponse;
    }

    function sync (fs: FileSystem, changeList: ChangeResponse[]) {
      const mfs = mocked(fs);
      mfs.sync.mockResolvedValueOnce(changeList);
      const btn = screen.getByRole('button', { name: 'sync' });
      userEvent.click(btn);
    }

    function loadRoot (
      fs: FileSystem,
      rootId: string,
      children: Partial<NodeResponse>[],
    ) {
      const mfs = mocked(fs);
      mfs.root.mockResolvedValueOnce(makeNode({
        id: rootId,
        parent_list: [],
      }));
      mfs.list.mockResolvedValueOnce(children.map(makeNode));
      const btn = screen.getByRole('button', { name: 'loadRoot' });
      userEvent.click(btn);
    }

    function loadList (
      fs: FileSystem,
      id: string,
      children: Partial<NodeResponse>[],
    ) {
      const mfs = mocked(fs);
      const btn = screen.getByRole('button', { name: 'loadList' });
      btn.dataset['id'] = id;
      mfs.list.mockResolvedValueOnce(children.map(makeNode));
      userEvent.click(btn);
    }

    function rename (fs: FileSystem, id: string, name: string) {
      const mfs = mocked(fs);
      const btn = screen.getByRole('button', { name: 'rename' });
      btn.dataset['id'] = id;
      btn.dataset['name'] = name;
      mfs.rename.mockResolvedValueOnce();
      mfs.sync.mockResolvedValueOnce([
        { removed: false, node: makeNode({ id, name, parent_list: ['1'] }) },
      ]);
      userEvent.click(btn);
    }

    function mkdir (fs: FileSystem, name: string, parentId: string, newId: string) {
      const mfs = mocked(fs);
      const btn = screen.getByRole('button', { name: 'mkdir' });
      btn.dataset['name'] = name;
      btn.dataset['parentId'] = parentId;
      mfs.mkdir.mockResolvedValueOnce();
      mfs.sync.mockResolvedValueOnce([
        { removed: false, node: makeNode({ id: newId, name, parent_list: [parentId] }) },
      ]);
      userEvent.click(btn);
    }

    function download (fs: FileSystem, idList: string[]) {
      const mfs = mocked(fs);
      mfs.download.mockImplementation((id: string) => {
        return id;
      });
      const fakeOpen = jest.spyOn(window, 'open').mockReturnValue(null);
      const btn = screen.getByRole('button', { name: 'download' });
      btn.dataset['idList'] = JSON.stringify(idList);
      userEvent.click(btn);
      return fakeOpen;
    }

    function copyUrl (fs: FileSystem, idList: string[]) {
      const mfs = mocked(fs);
      mfs.stream.mockImplementation((id: string) => {
        return id;
      });
      const fakeWriteText = jest.fn();
      fakeWriteText.mockResolvedValue(null);
      Object.defineProperty(window.navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: fakeWriteText,
        },
      });
      const btn = screen.getByRole('button', { name: 'copyUrl' });
      btn.dataset['idList'] = JSON.stringify(idList);
      userEvent.click(btn);
      return {
        fakeWriteText,
      };
    }

    function openUrl (fs: FileSystem, node: INodeLike) {
      const mfs = mocked(fs);
      mfs.apply.mockResolvedValueOnce();
      const actionList = {
        video: 'vlc',
      };
      mfs.stream.mockImplementation((id, name) => `${id}:${name}`);
      localStorage.setItem('actionList', JSON.stringify(actionList));

      const btn = screen.getByRole('button', { name: 'openUrl' });
      btn.dataset['node'] = JSON.stringify(node);
      userEvent.click(btn);

      return {
        cleanUp () {
          localStorage.clear();
        },
      };
    }

    function setSortKey (sortKey: SortKey) {
      const btn = screen.getByRole('button', { name: 'setSortKey' });
      btn.dataset['sortKey'] = sortKey;
      userEvent.click(btn);
    }

    function getNode (id: string) {
      const btn = screen.getByRole('button', { name: 'getNode' });
      btn.dataset['id'] = id;
      userEvent.click(btn);
    }

    function updating () {
      return screen.getByRole('checkbox', { name: 'updating' });
    }

    function noRoot () {
      return screen.getByRole('checkbox', { name: 'no-root' });
    }

    function rootId () {
      return screen.getByRole('textbox', { name: 'root-id' });
    }

    function sortKey () {
      return screen.getByRole('textbox', { name: 'sort-key' });
    }

    function revision () {
      return screen.getByRole('spinbutton');
    }

    function nodes () {
      return screen.getByRole('list');
    }

    function noNode () {
      return screen.getByRole('checkbox', { name: 'no-node' });
    }

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('has good initial state', () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(updating()).not.toBeChecked();
      expect(noRoot()).toBeChecked();
      expect(rootId()).toHaveValue('');
      expect(sortKey()).toHaveValue(SORT_BY_MTIME_DES);
      expect(revision()).toHaveValue(0);
      expect(nodes().childElementCount).toEqual(0);
    });

    it('sync', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      sync(fileSystem, [
        { removed: false, node: makeNode({ id: '2', parent_list: ['1'] }) },
        { removed: false, node: makeNode({ id: '3', parent_list: ['1'] }) },
      ]);
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(updating()).toBeChecked();
      expect(revision()).toHaveValue(0);

      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(revision()).toHaveValue(1);
      expect(nodes().childElementCount).toEqual(2);

      sync(fileSystem, [
        {
          removed: false,
          node: makeNode({
            id: '2',
            parent_list: ['1'],
            trashed: true,
          }),
        },
      ]);
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(updating()).toBeChecked();
      expect(revision()).toHaveValue(1);

      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(revision()).toHaveValue(2);
      expect(nodes().childElementCount).toEqual(1);

      sync(fileSystem, [
        { removed: true, id: '3' },
      ]);
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(updating()).toBeChecked();
      expect(revision()).toHaveValue(2);

      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(revision()).toHaveValue(3);
      expect(nodes().childElementCount).toEqual(0);
    });

    it('loadRoot', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadRoot(fileSystem, '1', []);
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(updating()).toBeChecked();
      expect(revision()).toHaveValue(0);
      expect(noRoot()).toBeChecked();

      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(fileSystem.list).toHaveBeenLastCalledWith('1');
      expect(revision()).toHaveValue(1);
      expect(rootId()).toHaveValue('1');
      expect(nodes().childElementCount).toEqual(1);
    });

    it('loadList', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadRoot(fileSystem, '1', [
        {
          id: '2',
          parent_list: ['1'],
        },
      ]);
      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });

      loadList(fileSystem, '2', [
        {
          id: '3',
          parent_list: ['2'],
        },
      ]);
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(updating()).toBeChecked();
      expect(revision()).toHaveValue(1);
      expect(nodes().childElementCount).toEqual(2);

      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(revision()).toHaveValue(1);
      expect(nodes().childElementCount).toEqual(3);
    });

    it('rename', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadRoot(fileSystem, '1', [
        {
          id: '2',
          name: 'foo',
          parent_list: ['1'],
        },
      ]);
      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });

      rename(fileSystem, '2', 'bar');
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(updating()).toBeChecked();
      expect(screen.getByTestId('2')).toHaveTextContent('foo');

      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(fileSystem.rename).toHaveBeenLastCalledWith('2', 'bar');
      expect(screen.getByTestId('2')).toHaveTextContent('bar');
    });

    it('mkdir', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadRoot(fileSystem, '1', [
        {
          id: '2',
          name: 'foo',
          parent_list: ['1'],
        },
      ]);
      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });

      mkdir(fileSystem, 'bar', '1', '3');
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(updating()).toBeChecked();
      expect(screen.getByTestId('2')).toHaveTextContent('foo');

      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(fileSystem.mkdir).toHaveBeenLastCalledWith('bar', '1');
      expect(screen.getByTestId('3')).toHaveTextContent('bar');
    });

    it('download', () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      const fakeOpen = download(fileSystem, ['2']);
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(fakeOpen).toHaveBeenCalledWith('2', '_blank');
    });

    it('copyUrl', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadRoot(fileSystem, '1', [
        {
          id: '2',
          name: 'foo',
          parent_list: ['1'],
        },
      ]);
      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });

      const { fakeWriteText } = copyUrl(fileSystem, ['2']);
      expect(fakeWriteText).toHaveBeenCalledWith('2');
    });

    it('openUrl', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      const { cleanUp } = openUrl(fileSystem, {
        id: '2',
        name: 'foo',
        mimeType: 'video/mp4',
        parentId: '1',
        children: null,
      });
      await waitFor(() => {
        expect(fileSystem.apply).toHaveBeenCalledTimes(1);
      });
      expect(fileSystem.apply).toHaveBeenCalledWith('vlc', {
        url: `2:foo`,
      });

      cleanUp();
    });

    it('setSortKey', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadRoot(fileSystem, '1', [
        { id: '2', name: 'two', modified: '2', parent_list: ['1'] },
        { id: '3', name: 'three', modified: '3', parent_list: ['1'] },
        { id: '4', name: 'four', modified: '4', parent_list: ['1'] },
        { id: '5', name: 'five', modified: '2', parent_list: ['1'] },
        { id: '6', name: 'six', modified: '3', parent_list: ['1'] },
        { id: '7', name: 'seven', modified: '4', parent_list: ['1'] },
        { id: '77', name: 'seven', modified: '5', parent_list: ['1'] },
      ]);
      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });

      setSortKey(SORT_BY_MTIME_ASC);
      expect(sortKey()).toHaveValue(SORT_BY_MTIME_ASC);

      setSortKey(SORT_BY_NAME_ASC);
      expect(sortKey()).toHaveValue(SORT_BY_NAME_ASC);
    });

    it('getNode', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem();
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadRoot(fileSystem, '1', [
        {
          id: '2',
          name: 'foo',
          parent_list: ['1'],
        },
      ]);
      await waitFor(() => {
        expect(updating()).not.toBeChecked();
      });

      getNode('2');
      expect(noNode()).not.toBeChecked();
    });

  });

});
