import { getContext, setContext } from "svelte";
import { get, writable } from "svelte/store";

import type { ImageResponse } from "$types/api";
import {
  clearCachedImage,
  listCachedImage,
  listImage,
  readNode,
} from "$tools/api";

type ImageData = ImageResponse;
type ComicData = {
  name: string;
  imageList: ImageData[];
  unpacking: boolean;
};
type ComicMap = Record<string, ComicData>;

const KEY = Symbol();

export function createStore() {
  const idList = writable<string[]>([]);
  const comicMap = writable<ComicMap>({});

  async function openComic(id: string, name: string) {
    comicMap.update((self) => {
      self[id] = {
        name,
        imageList: [],
        unpacking: true,
      };
      return self;
    });
    idList.update((self) => {
      if (self.indexOf(id) >= 0) {
        return self;
      }
      return [...self, id];
    });

    try {
      if (!name) {
        const rawNode = await readNode(id);
        comicMap.update((self) => {
          self[id].name = rawNode.name;
          return self;
        });
      }

      const imageList = await listImage(id);
      comicMap.update((self) => {
        self[id].imageList = imageList;
        self[id].unpacking = false;
        return self;
      });
    } catch (e: unknown) {
      console.warn(e);
      comicMap.update((self) => {
        self[id].unpacking = false;
        return self;
      });
    }
  }

  async function openCachedComic() {
    {
      const _idList = get(idList);
      const _comicMap = get(comicMap);
      const reloadList = _idList.map((id) => openComic(id, _comicMap[id].name));
      await Promise.all(reloadList);
    }

    const cacheList = await listCachedImage();
    const _comicMap = get(comicMap);
    const _idList = get(idList);
    for (const cache of cacheList) {
      // skip existing record
      if (_comicMap[cache.id]) {
        continue;
      }
      _idList.push(cache.id);
      _comicMap[cache.id] = {
        name: cache.name,
        imageList: cache.image_list,
        unpacking: false,
      };
    }
    comicMap.set(_comicMap);
    idList.set(_idList);
  }

  async function clearComic() {
    await clearCachedImage();
    idList.set([]);
    comicMap.set({});
  }

  return {
    idList,
    comicMap,
    openComic,
    openCachedComic,
    clearComic,
  };
}

export type ComicStore = ReturnType<typeof createStore>;

export function setComicContext() {
  return setContext(KEY, createStore());
}

export function getComicContext() {
  return getContext<ComicStore>(KEY);
}
