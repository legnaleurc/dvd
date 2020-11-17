import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

    interface IRoot {
      fileSystem: FileSystem;
      getNode: (id: string) => INodeLike;
      actionStub: () => void;
    }
    function Root (props: IRoot) {
      const { fileSystem, getNode, actionStub } = props;
      return (
        <GlobalProvider fileSystem={fileSystem}>
          <FileSystemProvider>
            <QueueProvider>
              <Action getNode={getNode} stub={actionStub} />
              <State />
            </QueueProvider>
          </FileSystemProvider>
        </GlobalProvider>
      );
    }

    interface IAction {
      stub: () => void;
      getNode: (id: string) => INodeLike;
    }
    function Action (props: IAction) {
      const { stub, getNode } = props;
      const { moveNodes, trashNodes } = useQueueAction();

      const onMove = makeEventHandler(async (event) => {
        const data = event.currentTarget.dataset;
        const srcList: string[] = JSON.parse(data['srcList']!);
        const dst = data['dst']!;
        await moveNodes(getNode, srcList, dst);
      }, [moveNodes, getNode]);
      const onTrash = makeEventHandler(async (event) => {
        const data = event.currentTarget.dataset;
        const idList: string[] = JSON.parse(data['idList']!);
        await trashNodes(getNode, idList);
      }, [trashNodes, getNode]);

      React.useEffect(() => {
        stub();
      }, [stub, moveNodes, trashNodes]);

      return (
        <>
          <button aria-label="move" onClick={onMove} />
          <button aria-label="trash" onClick={onTrash} />
        </>
      );
    }

    function State (props: {}) {
      const {
        nameList,
        pendingCount,
        rejectedCount,
        resolvedCount,
      } = useQueueState();
      return (
        <>
          <ul>
            {nameList.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
          <input type="number" readOnly={true} aria-label="pending" value={pendingCount} />
          <input type="number" readOnly={true} aria-label="rejected" value={rejectedCount} />
          <input type="number" readOnly={true} aria-label="resolved" value={resolvedCount} />
        </>
      );
    }

    type EventHandler = (event: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
    function makeEventHandler<T extends readonly unknown[]> (
      handler: EventHandler,
      dependencies: readonly [...T],
    ) {
      return React.useCallback(handler, dependencies);
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

    function move (fs: FileSystem, srcList: string[], dst: string) {
      const mfs = mocked(fs);
      const blocker = new Event_();
      mfs.move.mockImplementation(async (src: string, dst: string) => {
        await blocker.wait();
      });
      const btn = screen.getByRole('button', { name: 'move' });
      btn.dataset['srcList'] = JSON.stringify(srcList);
      btn.dataset['dst'] = dst;
      userEvent.click(btn);
      return {
        unblock () {
          blocker.set();
        },
      };
    }

    function trash (fs: FileSystem, idList: string[]) {
      const mfs = mocked(fs);
      const blocker = new Event_();
      mfs.trash.mockImplementation(async (id: string) => {
        await blocker.wait();
      });
      const btn = screen.getByRole('button', { name: 'trash' });
      btn.dataset['idList'] = JSON.stringify(idList);
      userEvent.click(btn);
      return {
        unblock () {
          blocker.set();
        },
      };
    }

    function nameList () {
      return screen.getAllByRole('listitem');
    }

    function pendingCount () {
      return screen.getByRole('spinbutton', { name: 'pending' });
    }

    function rejectedCount () {
      return screen.getByRole('spinbutton', { name: 'rejected' });
    }

    function resolvedCount () {
      return screen.getByRole('spinbutton', { name: 'resolved' });
    }

    it('should have empty initial state', () => {
      const fileSystem = newFileSystem({});
      const { getNode } = makeNodeList();
      const actionStub = jest.fn();
      render((
        <Root
          fileSystem={fileSystem}
          getNode={getNode}
          actionStub={actionStub}
        />
      ));

      expect(actionStub).toHaveBeenCalledTimes(1);
      const rv = nameList().every((el) => !el.textContent);
      expect(rv).toBeTruthy();
      expect(pendingCount()).toHaveValue(0);
      expect(rejectedCount()).toHaveValue(0);
      expect(resolvedCount()).toHaveValue(0);
    });

    it('can move items', async () => {
      const fileSystem = newFileSystem({
        move: jest.fn(),
      });
      const { nodeList, getNode } = makeNodeList();
      const actionStub = jest.fn();
      render((
        <Root
          fileSystem={fileSystem}
          getNode={getNode}
          actionStub={actionStub}
        />
      ));

      const { unblock } = move(fileSystem, Object.keys(nodeList), '8');
      expect(pendingCount()).toHaveValue(8);

      unblock();
      await waitFor(() => {
        expect(pendingCount()).toHaveValue(0);
      });
      expect(resolvedCount()).toHaveValue(8);
      expect(actionStub).toHaveBeenCalledTimes(1);
    });

    it('can trash items', async () => {
      const fileSystem = newFileSystem({
        trash: jest.fn(),
      });
      const { nodeList, getNode } = makeNodeList();
      const actionStub = jest.fn();
      render((
        <Root
          fileSystem={fileSystem}
          getNode={getNode}
          actionStub={actionStub}
        />
      ));

      const { unblock } = trash(fileSystem, Object.keys(nodeList));
      expect(pendingCount()).toHaveValue(8);

      unblock();
      await waitFor(() => {
        expect(pendingCount()).toHaveValue(0);
      });
      expect(resolvedCount()).toHaveValue(8);
      expect(actionStub).toHaveBeenCalledTimes(1);
    });

  });

});
