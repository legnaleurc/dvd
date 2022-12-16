import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";

import { listVideo } from "$tools/api";

type VideoData = {
  id: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  path: string;
};

const KEY = Symbol();

export function createStore() {
  const idList = writable<string[]>([]);
  const videoMap = writable<Record<string, VideoData>>({});
  const errorList = writable<string[]>([]);

  async function openVideo(id: string) {
    try {
      const videoList = await listVideo(id);
      videoMap.update((self) => {
        for (const video of videoList) {
          self[video.id] = {
            id: video.id,
            name: video.name,
            mimeType: video.mime_type,
            width: video.width,
            height: video.height,
            path: video.path,
          };
        }
        return self;
      });
      idList.update((self) => {
        for (const video of videoList) {
          if (self.indexOf(video.id) < 0) {
            self.push(video.id);
          }
        }
        return self;
      });
    } catch (e: unknown) {
      errorList.update((self) => {
        self.push((e as Error).message);
        return self;
      });
    }
  }

  function clearAllVideo() {
    idList.set([]);
    videoMap.set({});
  }

  function clearError() {
    errorList.set([]);
  }

  return {
    idList,
    videoMap,
    errorList,
    openVideo,
    clearAllVideo,
    clearError,
  };
}

export type VideoStore = ReturnType<typeof createStore>;

export function setVideoContext() {
  setContext(KEY, createStore());
}

export function getVideoContext() {
  return getContext<VideoStore>(KEY);
}
