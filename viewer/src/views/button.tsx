import React from 'react';

import './button.scss';


export function Button (props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="button"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
