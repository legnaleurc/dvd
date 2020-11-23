import { ImageResponse } from '@/lib';


export type ImageData = ImageResponse & {
  url: string;
};


interface LoadBeginData {
  id: string;
  name: string;
}


interface LoadEndData {
  id: string;
  imageList: ImageData[];
}


interface ErrorData {
  id: string;
  error: Error;
}


interface IAction<T, V> {
  type: T;
  value: V;
}


export type ActionType = (
  | IAction<'LOAD_BEGIN', LoadBeginData>
  | IAction<'LOAD_END', LoadEndData>
  | IAction<'ERROR', ErrorData>
);
