import React from 'react';

import { FileSystem } from '@/lib';


interface IContext {
  fileSystem: FileSystem;
}
const Context = React.createContext<IContext | null>(null);


interface IProps {
  fileSystem: FileSystem;
}
export const GlobalProvider: React.FC<IProps> = (props) => {
  const value = React.useMemo(() => ({
    fileSystem: props.fileSystem,
  }), [props.fileSystem]);
  return (
    <Context.Provider value={value}>
      {props.children}
    </Context.Provider>
  );
};


export function useGlobal () {
  const context = React.useContext(Context);
  if (!context) {
    throw new Error('global context is not ready');
  }
  return context;
}
