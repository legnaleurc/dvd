import React from 'react';

import './input.scss';


export function Input (props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="input"
      type={props.type}
      value={props.value}
      defaultValue={props.defaultValue}
      onChange={props.onChange}
      onChangeCapture={props.onChangeCapture}
      onKeyPress={props.onKeyPress}
      onKeyPressCapture={props.onKeyPressCapture}
    />
  );
};
