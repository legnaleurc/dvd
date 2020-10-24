import React from 'react';
import clsx from 'clsx';

import { Classes } from './hooks';


interface IProps {
  index: number;
  value: number;
  classes: Classes;
}
export function TabPanel (props: React.PropsWithChildren<IProps>) {
  const { children, classes, value, index } = props;
  return (
    <div className={clsx(classes.tabPanel, {
      [classes.hidden]: value !== index,
    })}>
      {children}
    </div>
  );
}
