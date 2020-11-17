import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mocked } from 'ts-jest/utils';

import { FileSystem, INodeLike } from '@/lib';
import { GlobalProvider } from '@/views/hooks/global';
import {
  FileSystemProvider,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { QueueProvider } from '@/views/hooks/queue';
import { ComicProvider } from '@/views/hooks/comic';
import {
  RichSelectableProvider,
  RichSelectableArea,
  RichSelectableTrigger,
} from '@/views/hooks/rich_selectable';
import { ContentActionBar } from '@/views/widgets/content_action_bar';


describe('content_action_bar', () => {

  describe('<ContentActionBar />', () => {

    interface IRoot {
      fileSystem: FileSystem;
      nodeList: string[];
      getSourceList: (id: string) => string[] | null;
      getNode: (id: string) => INodeLike;
    }
    function Root (props: IRoot) {
      const { fileSystem, nodeList, getSourceList, getNode } = props;
      const classes = React.useMemo(() => ({
        selected: '',
      }), []);
      return (
        <GlobalProvider fileSystem={fileSystem}>
          <FileSystemProvider>
            <QueueProvider>
              <ComicProvider>
                <RichSelectableProvider
                  classes={classes}
                  revision={0}
                  getSourceList={getSourceList}
                >
                  <ContentActionBar getNode={getNode} />
                  <Status />
                  <div role="list">
                    {nodeList.map((id) => (
                      <Item key={id} nodeId={id} />
                    ))}
                  </div>
                </RichSelectableProvider>
              </ComicProvider>
            </QueueProvider>
          </FileSystemProvider>
        </GlobalProvider>
      );
    }

    function Status (props: {}) {
      const { syncing } = useFileSystemState();
      return (
        <>
          <input type="checkbox" readOnly={true} checked={syncing} />
        </>
      );
    }

    interface IItem {
      nodeId: string;
    }
    function Item (props: IItem) {
      return (
        <div role="listitem" data-testid={props.nodeId}>
          <RichSelectableArea nodeId={props.nodeId}>
            <RichSelectableTrigger nodeId={props.nodeId}>
              <span>{props.nodeId}</span>
            </RichSelectableTrigger>
          </RichSelectableArea>
        </div>
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

    function click (id: string) {
      const item = screen.getByText(id);
      userEvent.click(item);
      act(() => {
        jest.runOnlyPendingTimers();
      });
    }

    function trash (fs: FileSystem) {
      const mfs = mocked(fs);
      mfs.trash.mockResolvedValue();
      mfs.sync.mockResolvedValueOnce([]);
      const btn = screen.getByRole('button', { name: 'trash' });
      userEvent.click(btn);
    }

    function syncing () {
      return screen.getByRole('checkbox');
    }

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('can trash selected items', async () => {
      const fileSystem = newFileSystem({
        trash: jest.fn(),
        sync: jest.fn(),
      });
      const { nodeList, getNode } = makeNodeList();
      const getSourceList = () => Object.keys(nodeList);
      render((
        <Root
          fileSystem={fileSystem}
          nodeList={Object.keys(nodeList)}
          getSourceList={getSourceList}
          getNode={getNode}
        />
      ));

      click('1');
      click('2');
      trash(fileSystem);
      await waitFor(() => {
        expect(syncing()).not.toBeChecked();
      });
      expect(fileSystem.trash).toHaveBeenCalledTimes(2);
    });

  });

});
