import React from 'react';

import { useInstance } from '@/lib';


interface IContext {
  fullScreen: boolean;
  toggleFullScreen: () => void;
}
const Context = React.createContext<IContext>({
  fullScreen: true,
  toggleFullScreen: () => {},
});


export function FullScreenProvider (props: React.PropsWithChildren<{}>) {
  const [fullScreen, setFullScreen] = React.useState(false);
  const self = useInstance(() => ({
    toggle () {
      setFullScreen(!fullScreen);
    },
  }), [fullScreen, setFullScreen]);
  const toggle = React.useCallback(() => {
    self.current.toggle();
  }, [self]);

  return (
    <Context.Provider value={{
      fullScreen,
      toggleFullScreen: toggle,
    }}>
      {props.children}
    </Context.Provider>
  );
}


export function useFullScreen () {
  return React.useContext(Context);
}
