import React from 'react';

import { useInstance } from '@/lib';


interface IContext {
  fullScreen: boolean;
  toggleFullScreen: () => void;
  leaveFullScreen: () => void;
}
const Context = React.createContext<IContext>({
  fullScreen: true,
  toggleFullScreen: () => {},
  leaveFullScreen: () => {},
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
  const leave = React.useCallback(() => {
    setFullScreen(false);
  }, [setFullScreen]);

  return (
    <Context.Provider value={{
      fullScreen,
      toggleFullScreen: toggle,
      leaveFullScreen: leave,
    }}>
      {props.children}
    </Context.Provider>
  );
}


export function useFullScreen () {
  return React.useContext(Context);
}
