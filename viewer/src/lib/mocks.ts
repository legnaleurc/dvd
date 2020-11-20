import React from 'react';

import { FileSystem } from './api';


export function newFileSystem () {
  return {
    root: jest.fn(),
    list: jest.fn(),
    sync: jest.fn(),
    rename: jest.fn(),
    mkdir: jest.fn(),
    download: jest.fn(),
    stream: jest.fn(),
    apply: jest.fn(),
  } as unknown as FileSystem;
}


type EventHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
type AsyncEventHandler = (event: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
export function makeEventHandler<T extends readonly unknown[]> (
  handler: EventHandler | AsyncEventHandler,
  dependencies: readonly [...T],
) {
  return React.useCallback(handler, dependencies);
}
