import React from 'react';
import clsx from 'clsx';

import { ISelectionClasses } from './types';
import { useRichSelectableState } from './context';


interface IPureProps {
  selected: boolean;
  classes: ISelectionClasses;
}
function PureArea (props: React.PropsWithChildren<IPureProps>) {
  const { classes, selected } = props;
  return (
    <div className={clsx('selectable-area', {
      [classes.selected]: selected,
    })}>
      {props.children}
    </div>
  );
}
const MemorizedPureArea = React.memo(PureArea);


interface IProps {
  nodeId: string;
}
export function Area (props: React.PropsWithChildren<IProps>) {
  const { dict, classes } = useRichSelectableState();
  return (
    <MemorizedPureArea
      classes={classes}
      selected={dict[props.nodeId]}
    >
      {props.children}
    </MemorizedPureArea>
  );
}
