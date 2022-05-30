import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";

import { listVideo } from "$lib/tools/api";

type VideoData = {
  id: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
};

const KEY = Symbol();

export function createStore() {
  const idList = writable<string[]>([]);
  const videoMap = writable<Record<string, VideoData>>({});

  async function openVideo(id: string) {
    const videoList = await listVideo(id);
    videoMap.update((self) => {
      for (const video of videoList) {
        self[video.id] = {
          id: video.id,
          name: video.name,
          mimeType: video.mime_type,
          width: video.width,
          height: video.height,
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
  }

  function clearAllVideo() {
    idList.set([]);
    videoMap.set({});
  }

  return {
    idList,
    videoMap,
    openVideo,
    clearAllVideo,
  };
}

export type VideoStore = ReturnType<typeof createStore>;

export function setVideoContext() {
  setContext(KEY, createStore());
}

export function getVideoContext() {
  return getContext<VideoStore>(KEY);
}
