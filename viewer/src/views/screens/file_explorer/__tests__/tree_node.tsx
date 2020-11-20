import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mocked } from 'ts-jest/utils';

import { FileSystem, NodeResponse } from '@/lib';
import { GlobalProvider } from '@/views/hooks/global';
import {
  FileSystemProvider,
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { QueueProvider } from '@/views/hooks/queue';
import { RichSelectableProvider } from '@/views/hooks/rich_selectable';
import { TreeNode } from '@/views/screens/file_explorer/tree_node';
import { newFileSystem } from '@/lib/mocks';


describe('tree_node', () => {

  describe('<TreeNode />', () => {

    interface IRootProps {
      fileSystem: FileSystem;
    }
    function Root (props: IRootProps) {
      return (
        <GlobalProvider fileSystem={props.fileSystem}>
          <FileSystemProvider>
            <QueueProvider>
              <SelectableRoot />
            </QueueProvider>
          </FileSystemProvider>
        </GlobalProvider>
      );
    }

    function SelectableRoot (props: {}) {
      const { loadRoot } = useFileSystemAction();
      const { revision } = useFileSystemState();
      const [initialized, setInitialized] = React.useState(false);

      const getList = (id: string) => null;

      React.useEffect(() => {
        loadRoot().then(() => {
          setInitialized(true);
        });
      }, [setInitialized]);

      if (!initialized) {
        return <h1>loading</h1>;
      }

      return (
        <RichSelectableProvider
          revision={revision}
          classes={{
            selected: 'selected',
          }}
          getSourceList={getList}
        >
          <TreeNode nodeId='2'/>
        </RichSelectableProvider>
      );
    }

    function makeNode (node: Partial<NodeResponse>): NodeResponse {
      return node as NodeResponse;
    }

    function mockRoot (fs: FileSystem, rootId: string, children: Partial<NodeResponse>[]) {
      const mfs = mocked(fs);
      mfs.root.mockResolvedValueOnce(makeNode({
        id: rootId,
        parent_list: [],
      }));
      mfs.list.mockResolvedValueOnce(children.map(makeNode));
    }

    function mockList(fs: FileSystem, id: string, children: Partial<NodeResponse>[]) {
      const mfs = mocked(fs);
      mfs.list.mockResolvedValueOnce(children.map((node) => {
        node.parent_list = [id];
        return node;
      }).map(makeNode));
    }

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('has no indicator for file', async () => {
      const fileSystem = newFileSystem();
      mockRoot(fileSystem, '1', [
        { id: '2', name: 'item2', is_folder: false },
      ]);
      render(<Root fileSystem={fileSystem} />);
      await screen.findByRole('treeitem')

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('has indicator for folder and can be expanded', async () => {
      const fileSystem = newFileSystem();
      mockRoot(fileSystem, '1', [
        { id: '2', name: 'item2', is_folder: true },
      ]);
      render(<Root fileSystem={fileSystem} />);
      await screen.findByRole('treeitem')

      mockList(fileSystem, '2', [
        { id: '3', name: 'item3' },
        { id: '4', name: 'item4' },
      ]);
      const btn = screen.getByRole('button');
      userEvent.click(btn);
      const treeNode = screen.getByRole('treeitem')
      await waitFor(() => {
        expect(treeNode).toHaveAttribute('aria-expanded', 'true');
      });
      const treeNodes = screen.queryAllByRole('treeitem');
      expect(treeNodes).toHaveLength(3);
    });

    it('can toggle selection', async () => {
      const fileSystem = newFileSystem();
      mockRoot(fileSystem, '1', [
        { id: '2', name: 'item2', is_folder: false },
      ]);
      render(<Root fileSystem={fileSystem} />);
      const item = await screen.findByRole('treeitem')

      const label = screen.getByText('item2');
      userEvent.click(label);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(item).toHaveAttribute('aria-selected', 'true');
      userEvent.click(label);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(item).toHaveAttribute('aria-selected', 'false');
    });

  });

});
