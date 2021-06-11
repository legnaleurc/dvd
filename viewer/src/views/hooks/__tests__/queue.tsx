import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { mocked } from 'ts-jest/utils';

import { FileSystem, INodeLike } from '@/lib';
import { Event_ } from '@/lib/lock';
import { GlobalProvider } from '@/views/hooks/global';
import { FileSystemProvider } from '@/views/hooks/file_system';
import {
  QueueProvider,
  useQueueAction,
  useQueueState,
} from '@/views/hooks/queue';


describe('queue', () => {

  describe('<QueueProvider />', () => {

    type IActionContext = ReturnType<typeof useQueueAction>;

    interface IRoot {
      fileSystem: FileSystem;
    }
    const Root: React.FC<IRoot> = ({ children, fileSystem }) => {
      return (
        <GlobalProvider fileSystem={fileSystem}>
          <FileSystemProvider>
            <QueueProvider>
              {children}
            </QueueProvider>
          </FileSystemProvider>
        </GlobalProvider>
      );
    }

    function newFileSystem (mock: Record<string, any>) {
      return mock as unknown as FileSystem;
    }

    function makeNodeList () {
      const nodeList: Record<string, INodeLike> = {
        '1': { id: '1', name: 'one', mimeType: '', children: null, parentId: null },
        '2': { id: '2', name: 'two', mimeType: '', children: null, parentId: null },
        '3': { id: '3', name: 'three', mimeType: '', children: null, parentId: null },
        '4': { id: '4', name: 'four', mimeType: '', children: null, parentId: null },
        '5': { id: '5', name: 'five', mimeType: '', children: null, parentId: null },
        '6': { id: '6', name: 'six', mimeType: '', children: null, parentId: null },
        '7': { id: '7', name: 'seven', mimeType: '', children: null, parentId: null },
        '8': { id: '8', name: 'eight', mimeType: '', children: null, parentId: null },
      };
      const getNode = (id: string) => nodeList[id];
      return { nodeList, getNode };
    }

    function renderQueueHook (fileSystem: FileSystem) {
      return renderHook(() => ({
        state: useQueueState(),
        action: useQueueAction(),
      }), {
        wrapper: Root,
        initialProps: {
          fileSystem,
        },
      });
    }

    function fakeMove (
      actions: IActionContext,
      fileSystem: FileSystem,
      getNode: (id: string) => INodeLike,
      srcList: string[],
      dst: string,
    ) {
      const mfs = mocked(fileSystem);
      const blocker = new Event_();
      mfs.move.mockImplementationOnce(async (src: string, dst: string) => {
        await blocker.wait();
      });
      act(() => {
        actions.moveNodes(getNode, srcList, dst);
      });
      return {
        unblock () {
          blocker.set();
        },
      };
    }

    function fakeTrash (
      actions: IActionContext,
      fileSystem: FileSystem,
      getNode: (id: string) => INodeLike,
      srcList: string[],
    ) {
      const mfs = mocked(fileSystem);
      const blocker = new Event_();
      mfs.trash.mockImplementationOnce(async (src: string) => {
        await blocker.wait();
      });
      act(() => {
        actions.trashNodes(getNode, srcList);
      });
      return {
        unblock () {
          blocker.set();
        },
      };
    }

    it('should have empty initial state', () => {
      const fileSystem = newFileSystem({});
      const { result } = renderQueueHook(fileSystem);
      const actions = result.current.action;

      const state = result.current.state;
      const rv = state.nameList.every((el) => !el);
      expect(rv).toBeTruthy();
      expect(state.pendingCount).toBe(0);
      expect(state.rejectedCount).toBe(0);
      expect(state.resolvedCount).toBe(0);

      expect(result.current.action).toMatchObject(actions);
    });

    it('can move items', async () => {
      const fileSystem = newFileSystem({
        move: jest.fn(),
      });
      const { nodeList, getNode } = makeNodeList();
      const { result, waitForNextUpdate } = renderQueueHook(fileSystem);
      const actions = result.current.action;

      const { unblock } = fakeMove(
        result.current.action,
        fileSystem,
        getNode,
        Object.keys(nodeList),
        '8',
      );
      expect(result.current.state.pendingCount).toBe(8);

      unblock();
      await waitForNextUpdate();
      expect(result.current.state.pendingCount).toBe(0);
      expect(result.current.state.resolvedCount).toBe(8);

      expect(result.current.action).toMatchObject(actions);
    });

    it('can trash items', async () => {
      const fileSystem = newFileSystem({
        trash: jest.fn(),
      });
      const { nodeList, getNode } = makeNodeList();
      const { result, waitForNextUpdate } = renderQueueHook(fileSystem);
      const actions = result.current.action;

      const { unblock } = fakeTrash(
        result.current.action,
        fileSystem,
        getNode,
        Object.keys(nodeList),
      );
      expect(result.current.state.pendingCount).toBe(8);

      unblock();
      await waitForNextUpdate();
      expect(result.current.state.pendingCount).toBe(0);
      expect(result.current.state.resolvedCount).toBe(8);

      expect(result.current.action).toMatchObject(actions);
    });

  });

});
