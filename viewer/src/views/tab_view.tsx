import React from 'react';

import { classNameFromObject, connectConsumer } from '../lib';


interface ContextStore {
  active: string;
  onSwitch: (name: string) => void;
}


const Context = React.createContext<ContextStore>({
  active: '',
  onSwitch: (name: string) => {},
});


export function TabView (props: React.PropsWithChildren<ContextStore>) {
  return (
    <div className="tab-view">
      <Switch active={props.active} onSwitch={props.onSwitch}>
        {props.children}
      </Switch>
    </div>
  );
}


function Switch (props: React.PropsWithChildren<ContextStore>) {
  return (
    <Context.Provider
      value={{
        active: props.active,
        onSwitch: props.onSwitch,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}


export function TabLabelContainer (props: React.PropsWithChildren<{}>) {
  return (
    <div className="label-container">
      {props.children}
    </div>
  );
};


interface ITabLabelPropsType {
  name: string;
}
interface ITabLabelPrivatePropsType {
  active: string;
  onSwitch: (name: string) => void;
}


function Label (props: React.PropsWithChildren<ITabLabelPropsType & ITabLabelPrivatePropsType>) {
  return (
    <div
      className={classNameFromObject({
        label: true,
        active: props.name === props.active,
      })}
      onClick={() => {
        if (props.onSwitch) {
          props.onSwitch(props.name);
        }
      }}
    >
      {props.children}
    </div>
  );
}


const ConnectedLabel = connectConsumer(Context.Consumer, (
  value: ContextStore,
  _ownProps: ITabLabelPropsType,
) => ({
  active: value.active,
  onSwitch: value.onSwitch,
}))(Label);
export { ConnectedLabel as TabLabel };


export function TabPageContainer (props: React.PropsWithChildren<{}>) {
  return (
    <div className="page-container">
      {props.children}
    </div>
  );
};


interface ITabPagePropsType {
  name: string;
}
interface ITabPagePrivatePropsType {
  active: string;
}


function Page (props: React.PropsWithChildren<ITabPagePropsType & ITabPagePrivatePropsType>) {
  return (
    <div
      className={classNameFromObject({
        page: true,
        active: props.name === props.active,
      })}
    >
      {props.children}
    </div>
  );
}


const ConnectedPage = connectConsumer(Context.Consumer, (
  value: ContextStore,
  _ownProps: ITabPagePropsType,
) => ({
  active: value.active,
}))(Page);
export { ConnectedPage as TabPage };
