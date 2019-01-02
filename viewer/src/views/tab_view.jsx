import React from 'react';

import { classNameFromObject, connectConsumer } from '../lib';


const Context = React.createContext();


function TabView (props) {
  return (
    <div className="tab-view">
      <Switch active={props.active} onSwitch={props.onSwitch}>
        {props.children}
      </Switch>
    </div>
  );
}


function Switch (props) {
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


TabView.LabelContainer = function LabelContainer (props) {
  return (
    <div className="label-container">
      {props.children}
    </div>
  );
};


function Label (props) {
  return (
    <div
      className={classNameFromObject({
        label: true,
        active: props.name === props.active,
      })}
      onClick={event => {
        if (props.onSwitch) {
          props.onSwitch(props.name);
        }
      }}
    >
      {props.children}
    </div>
  );
}


TabView.Label = connectConsumer(Context.Consumer, value => ({
  active: value.active,
  onSwitch: value.onSwitch,
}))(Label);


TabView.PageContainer = function PageContainer (props) {
  return (
    <div className="page-container">
      {props.children}
    </div>
  );
};


function Page (props) {
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


TabView.Page = connectConsumer(Context.Consumer, value => ({
  active: value.active,
}))(Page);


export default TabView;
