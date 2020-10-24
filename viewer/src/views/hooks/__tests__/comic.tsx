import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FileSystem } from '@/lib';
import { GlobalProvider } from '@/views/hooks/global';
import {
  ComicProvider,
  useComicAction,
  useComicState,
} from '@/views/hooks/comic';


describe('comic', () => {

  describe('<ComicProvider />', () => {

    function Root (props: { fileSystem: FileSystem, actionStub: () => void }) {
      return (
        <GlobalProvider fileSystem={props.fileSystem}>
          <ComicProvider>
            <Action stub={props.actionStub} />
            <State />
          </ComicProvider>
        </GlobalProvider>
      );
    }

    function Action (props: { stub: () => void }) {
      const { loadComic } = useComicAction();

      React.useEffect(() => {
        props.stub();
      }, [props.stub, loadComic]);

      const onClick = React.useCallback(() => {
        loadComic('1', 'test.zip');
      }, [loadComic]);

      return (
        <button onClick={onClick} />
      );
    }

    function State (props: {}) {
      const { unpacking, name, imageList } = useComicState();
      return (
        <>
          <input type="checkbox" readOnly={true} checked={unpacking} />
          <input type="text" readOnly={true} value={name} />
          <div>
            {imageList.map((g, i) => (
              <img
                key={i}
                src={g.url}
                style={{
                  width: g.width,
                  height: g.height,
                }}
              />
            ))}
          </div>
        </>
      );
    }

    function load () {
      const btn = screen.getByRole('button');
      userEvent.click(btn);
    }

    function unpacking () {
      return screen.getByRole('checkbox');
    }

    function name () {
      return screen.getByRole('textbox');
    }

    function imageList () {
      return screen.queryAllByRole('img') as HTMLImageElement[];
    }

    function newFileSystem (factory: (fs: FileSystem) => Record<string, any>) {
      const fileSystem = new FileSystem();
      const mock = {
        image (id: string, imageId: number) {
          fileSystem.image(id, imageId);
        },
        ...factory(fileSystem),
      };
      return mock as unknown as FileSystem;
    }

    it('has good initial data', () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem(() => ({}));
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(unpacking()).not.toBeChecked();
      expect(name()).toHaveValue('');
      expect(imageList()).toHaveLength(0);
    });

    it('can load proper comic', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem((fs) => ({
        imageList: jest.fn().mockResolvedValue([
          {
            width: 100,
            height: 200,
          },
          {
            width: 300,
            height: 400,
          },
        ]),
      }));
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      load();
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(unpacking()).toBeChecked();
      expect(name()).toHaveValue('test.zip');
      expect(imageList()).toHaveLength(0);

      await waitFor(() => {
        expect(unpacking()).not.toBeChecked();
      });

      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(unpacking()).not.toBeChecked();
      expect(name()).toHaveValue('test.zip');
      expect(imageList()).toHaveLength(2);
    });

    it('clears state for bad comic', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem((fs) => ({
        imageList: jest.fn().mockRejectedValue(new Error('expected error')),
      }));
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      load();
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(unpacking()).toBeChecked();
      expect(name()).toHaveValue('test.zip');
      expect(imageList()).toHaveLength(0);

      await waitFor(() => {
        expect(unpacking()).not.toBeChecked();
      });

      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(name()).toHaveValue('');
      expect(imageList()).toHaveLength(0);
    });

  });

});
