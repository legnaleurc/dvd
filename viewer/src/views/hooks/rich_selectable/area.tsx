import React from 'react';
import clsx from 'clsx';

import { ISelectionClasses } from './types';
import { useRichSelectableState } from './context';


interface IPureProps {
  selected: boolean;
  classes: ISelectionClasses;
}
const PureArea: React.FC<IPureProps> = React.memo((props) => {
  const { classes, selected } = props;
  return (
    <div className={clsx('selectable-area', {
      [classes.selected]: selected,
    })}>
      {props.children}
    </div>
  );
});


interface IProps {
  nodeId: string;
}
export const Area: React.FC<IProps> = (props) => {
  const { dict, classes } = useRichSelectableState();
  return (
    <PureArea
      classes={classes}
      selected={dict[props.nodeId]}
    >
      {props.children}
    </PureArea>
  );
};
