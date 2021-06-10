import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';

import { FileSystem } from '@/lib';
import { GlobalProvider } from '@/views/hooks/global';
import {
  ComicProvider,
  useComicAction,
  useComicState,
} from '@/views/hooks/comic';


describe('comic', () => {

  describe('<ComicProvider />', () => {

    interface IRoot {
      fileSystem: FileSystem;
    }
    const Root: React.FC<IRoot> = ({ children, fileSystem }) => (
      <GlobalProvider fileSystem={fileSystem}>
        <ComicProvider>
          {children}
        </ComicProvider>
      </GlobalProvider>
    );

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

    function renderComicHook (fileSystem: FileSystem) {
      return renderHook(() => ({
        state: useComicState(),
        action: useComicAction(),
      }), {
        wrapper: Root,
        initialProps: {
          fileSystem,
        },
      });
    }

    it('has good initial data', () => {
      const fileSystem = newFileSystem(() => ({}));
      const { result } = renderHook(() => useComicState(), {
        wrapper: Root,
        initialProps: {
          fileSystem,
        },
      });

      expect(result.current.idList).toHaveLength(0);
    });

    it('can load proper comic', async () => {
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
      const { result, waitForNextUpdate } = renderComicHook(fileSystem);
      const actions = result.current.action;

      act(() => {
        result.current.action.loadComic('1', 'test.zip');
      });

      expect(result.current.state.comicDict).toHaveProperty('1');
      expect(result.current.state.comicDict['1'].unpacking).toBeTruthy();
      expect(result.current.state.comicDict['1'].name).toBe('test.zip');
      expect(result.current.state.comicDict['1'].imageList).toHaveLength(0);

      await waitForNextUpdate();

      expect(result.current.state.comicDict).toHaveProperty('1');
      expect(result.current.state.comicDict['1'].unpacking).toBeFalsy();
      expect(result.current.state.comicDict['1'].name).toBe('test.zip');
      expect(result.current.state.comicDict['1'].imageList).toHaveLength(2);

      expect(result.current.action).toStrictEqual(actions);
    });

    it('clears state for bad comic', async () => {
      const fileSystem = newFileSystem((fs) => ({
        imageList: jest.fn().mockRejectedValue(new Error('expected error')),
      }));
      const { result, waitForNextUpdate } = renderComicHook(fileSystem);
      const actions = result.current.action;

      act(() => {
        result.current.action.loadComic('1', 'test.zip');
      });

      expect(result.current.state.comicDict).toHaveProperty('1');
      expect(result.current.state.comicDict['1'].unpacking).toBeTruthy();
      expect(result.current.state.comicDict['1'].name).toBe('test.zip');
      expect(result.current.state.comicDict['1'].imageList).toHaveLength(0);

      await waitForNextUpdate();

      expect(result.current.state.comicDict).toHaveProperty('1');
      expect(result.current.state.comicDict['1'].unpacking).toBeFalsy();
      expect(result.current.state.comicDict['1'].name).toBe('test.zip');
      expect(result.current.state.comicDict['1'].imageList).toHaveLength(0);

      expect(result.current.action).toStrictEqual(actions);
    });

    it('can load cache from server', async () => {
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
      const { result } = renderComicHook(fileSystem);
      const actions = result.current.action;

      await act(async () => {
        await result.current.action.loadCache();
      });

      for (const book of expected) {
        expect(result.current.state.comicDict).toHaveProperty(book.id);
        const comic = result.current.state.comicDict[book.id];
        expect(comic.name).toBe(book.name);
        expect(comic.imageList).toHaveLength(book.image_list.length);
      }

      expect(result.current.action).toStrictEqual(actions);
    });

    it('can clear comic list', async () => {
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
      const { result } = renderComicHook(fileSystem);
      const actions = result.current.action;

      await act(async () => {
        await result.current.action.loadComic('1', 'test.zip');
      });

      expect(result.current.state.idList).toHaveLength(1);

      await act(async () => {
        await result.current.action.clearCache();
      });

      expect(result.current.state.comicDict).toMatchObject({});
      expect(result.current.state.idList).toHaveLength(0);

      expect(result.current.action).toStrictEqual(actions);
    });

  });

});
