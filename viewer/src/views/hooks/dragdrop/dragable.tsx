import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { useInstance } from '@/lib';


const useStyles = makeStyles((theme) => ({
  dragable: {
    '&$dragging': {
      cursor: 'move',
    },
  },
  dragging: {},
}));
type Classses = ReturnType<typeof useStyles>;


interface IProps {
  enabled: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  onDragEnd?: React.DragEventHandler<HTMLDivElement>;
}


function useActions (props: IProps, classes: Classses) {
  const self = useInstance(() => ({
    onDragStart (event: React.DragEvent<HTMLDivElement>) {
      const { onDragStart } = props;
      if (onDragStart) {
        onDragStart(event);
      }
    },
    onDragEnd (event: React.DragEvent<HTMLDivElement>) {
      const { onDragEnd } = props;
      if (onDragEnd) {
        onDragEnd(event);
      }
    },
    classes,
  }), [
    props.onDragEnd,
    props.onDragStart,
    classes,
  ]);

  const onDragStart = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.classList.add(self.current.classes.dragging);
    self.current.onDragStart(event);
  }, [self]);

  const onDragEnd = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.classList.remove(self.current.classes.dragging);
    self.current.onDragEnd(event);
  }, [self]);

  return {
    onDragStart,
    onDragEnd,
  };
}


export const Dragable: React.FC<IProps> = (props) => {
  const { enabled, children } = props;
  const classes = useStyles();
  const { onDragStart, onDragEnd } = useActions(props, classes);
  return (
    <div
      className={classes.dragable}
      draggable={enabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
    </div>
  );
};
