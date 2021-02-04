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
import { makeEventHandler } from '@/lib/mocks';


describe('comic', () => {

  describe('<ComicProvider />', () => {

    interface IRoot {
      fileSystem: FileSystem;
      actionStub: () => void;
    }
    function Root (props: IRoot) {
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
      const { loadComic, loadCache, clearCache } = useComicAction();

      React.useEffect(() => {
        props.stub();
      }, [props.stub, loadComic, loadCache, clearCache]);

      const onLoadComic = makeEventHandler((event) => {
        const data = event.currentTarget.dataset;
        const id = data['id']! as string;
        const name = data['name']! as string;
        loadComic(id, name);
      }, [loadComic]);

      return (
        <>
          <button aria-label="loadComic" onClick={onLoadComic} />
          <button aria-label="loadCache" onClick={loadCache} />
          <button aria-label="clearCache" onClick={clearCache} />
        </>
      );
    }

    function State (props: {}) {
      const { idList } = useComicState();
      const [current, setCurrent] = React.useState('');

      const onClick = makeEventHandler((event) => {
        const data = event.currentTarget.dataset;
        const current = data['current']! as string;
        setCurrent(current);
      }, [setCurrent]);

      return (
        <>
          <ul>
            {idList.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          <button aria-label="setCurrent" onClick={onClick} />
          <MaybeComic id={current} />
        </>
      );
    }

    interface IMaybeComic {
      id: string;
    }
    function MaybeComic (props: IMaybeComic) {
      const { comicDict } = useComicState();
      if (!props.id) {
        return null;
      }
      const { unpacking, name, imageList } = comicDict[props.id];
      return (
        <>
          <input type="checkbox" readOnly={true} checked={unpacking} />
          <input type="text" readOnly={true} value={name} />
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
        </>
      );
    }


    function loadComic (id: string, name: string) {
      const btn = screen.getByRole('button', { name: 'loadComic' });
      btn.dataset.id = id;
      btn.dataset.name = name;
      userEvent.click(btn);
    }


    function loadCache () {
      const btn = screen.getByRole('button', { name: 'loadCache' });
      userEvent.click(btn);
    }


    function clearCache () {
      const btn = screen.getByRole('button', { name: 'clearCache' });
      userEvent.click(btn);
    }


    function setId (id: string) {
      const btn = screen.getByRole('button', { name: 'setCurrent' });
      btn.dataset.current = id;
      userEvent.click(btn);
    }

    function idList () {
      return screen.queryAllByRole('listitem');
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

      expect(idList()).toHaveLength(0);
      expect(actionStub).toHaveBeenCalledTimes(1);
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

      loadComic('1', 'test.zip');
      setId('1');

      expect(unpacking()).toBeChecked();
      expect(name()).toHaveValue('test.zip');
      expect(imageList()).toHaveLength(0);

      await waitFor(() => {
        expect(unpacking()).not.toBeChecked();
      });

      expect(name()).toHaveValue('test.zip');
      expect(imageList()).toHaveLength(2);

      expect(actionStub).toHaveBeenCalledTimes(1);
    });

    it('clears state for bad comic', async () => {
      const actionStub = jest.fn();
      const fileSystem = newFileSystem((fs) => ({
        imageList: jest.fn().mockRejectedValue(new Error('expected error')),
      }));
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadComic('1', 'test.zip');
      setId('1');

      expect(unpacking()).toBeChecked();
      expect(name()).toHaveValue('test.zip');
      expect(imageList()).toHaveLength(0);

      await waitFor(() => {
        expect(unpacking()).not.toBeChecked();
      });

      expect(name()).toHaveValue('test.zip');
      expect(imageList()).toHaveLength(0);

      expect(actionStub).toHaveBeenCalledTimes(1);
    });

    it('can load cache from server', async () => {
      const actionStub = jest.fn();
      const expected = [
        {
          id: '1',
          name: '1.zip',
          image_list: [
            { width: 100, height: 100 },
            { width: 100, height: 100 },
          ],
        },
        {
          id: '2',
          name: '2.zip',
          image_list: [
            { width: 100, height: 100 },
            { width: 100, height: 100 },
            { width: 100, height: 100 },
            { width: 100, height: 100 },
          ],
        },
      ];
      const fileSystem = newFileSystem((fs) => ({
        fetchCache: jest.fn().mockResolvedValue(expected),
      }));
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadCache();

      await waitFor(() => {
        expect(idList()).toHaveLength(2);
      });

      for (const book of expected) {
        setId(book.id);
        expect(name()).toHaveValue(book.name);
        expect(imageList()).toHaveLength(book.image_list.length);
      }

      expect(actionStub).toHaveBeenCalledTimes(1);
    });

    it('can clear comic list', async () => {
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
        clearCache: jest.fn().mockResolvedValue(null),
      }));
      render(<Root fileSystem={fileSystem} actionStub={actionStub} />);

      loadComic('1', 'test.zip');

      setId('1');
      await waitFor(() => {
        expect(unpacking()).not.toBeChecked();
      });
      expect(idList()).toHaveLength(1);

      setId('');
      clearCache();

      await waitFor(() => {
        expect(idList()).toHaveLength(0);
      });

      expect(actionStub).toHaveBeenCalledTimes(1);
    });

  });

});
