import React from 'react';

import { useInstance } from '@/lib';


interface IStateContext {
  fullScreen: boolean;
}
const StateContext = React.createContext<IStateContext | null>(null);
interface IActionContext {
  toggleFullScreen: () => void;
  leaveFullScreen: () => void;
}
const ActionContext = React.createContext<IActionContext | null>(null);


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

  const actionValue = React.useMemo(() => ({
    toggleFullScreen: toggle,
    leaveFullScreen: leave,
  }), [toggle, leave]);
  const stateValue = React.useMemo(() => ({
    fullScreen,
  }), [fullScreen]);

  return (
    <ActionContext.Provider value={actionValue}>
      <StateContext.Provider value={stateValue}>
        {props.children}
      </StateContext.Provider>
    </ActionContext.Provider>
  );
}


export function useFullScreenState () {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error('full screen context is not ready');
  }
  return context;
}


export function useFullScreenAction () {
  const context = React.useContext(ActionContext);
  if (!context) {
    throw new Error('full screen context is not ready');
  }
  return context;
}
