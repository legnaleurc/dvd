import { ImageResponse } from '../../lib';


export type ImageData = ImageResponse & {
  url: string;
};


export interface MpvState {
  unpacking: boolean;
  imageList: ImageData[];
}


interface Action<T> {
  type: string;
  payload: T;
}


export const MPV_LOAD_TRY = 'MPV_LOAD_TRY';
export type TryLoadAction = Action<{
  list: string[];
  done: () => void;
}>;
export const MPV_LOAD_SUCCEED = 'MPV_LOAD_SUCCEED';
export type SucceedLoadAction = Action<{
  imageList: ImageData[];
}>;
export const MPV_LOAD_FAILED = 'MPV_LOAD_FAILED';
export type FailedLoadAction = Action<{
  message: string;
}>;


export type ActionTypes = (
  TryLoadAction |
  SucceedLoadAction |
  FailedLoadAction
);
