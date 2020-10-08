import { ImageResponse } from '@/lib';


export type ImageData = ImageResponse & {
  url: string;
};


interface IAction<T, V> {
  type: T;
  value: V;
}


export type ActionType = (
  | IAction<'LOAD_BEGIN', string>
  | IAction<'LOAD_END', ImageData[]>
  | IAction<'ERROR', Error>
);
