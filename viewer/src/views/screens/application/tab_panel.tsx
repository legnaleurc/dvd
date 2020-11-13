import React from 'react';
import clsx from 'clsx';


interface IClasses {
  hidden: string;
  tabPanel: string;
}
interface IProps {
  index: number;
  value: number;
  classes: IClasses;
}
export const TabPanel: React.FC<IProps> = (props) => {
  const { children, classes, value, index } = props;
  return (
    <div className={clsx(classes.tabPanel, {
      [classes.hidden]: value !== index,
    })}>
      {children}
    </div>
  );
};
