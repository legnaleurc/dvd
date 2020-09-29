import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import { useInstance } from '@/lib';


const useDragableStyles = makeStyles((theme) => ({
  dragable: {
    '&$dragging': {
      cursor: 'move',
    },
  },
  dragging: {},
}));
type DragableClassses = ReturnType<typeof useDragableStyles>;


interface IDragablePropsType {
  enabled: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  onDragEnd?: React.DragEventHandler<HTMLDivElement>;
}


function useDragActions (props: IDragablePropsType, classes: DragableClassses) {
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


export function Dragable (props: React.PropsWithChildren<IDragablePropsType>) {
  const { enabled, children } = props;
  const classes = useDragableStyles();
  const { onDragStart, onDragEnd } = useDragActions(props, classes);
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
}


const useDropableStyles = makeStyles((theme) => ({
  dropable: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.background.default,
    '&$dragOver': {
      borderColor: theme.palette.text.primary,
    },
  },
  dragOver: {},
}));


interface IDropablePropsType {
  onDrop: React.DragEventHandler<HTMLDivElement>;
}


function useDropActions (
  props: IDropablePropsType,
  setDragOver: (dragOver: boolean) => void,
) {
  const self = useInstance(() => ({
    onDrop (event: React.DragEvent<HTMLDivElement>) {
      props.onDrop(event);
    },
  }), [props.onDrop]);
  const dragCounter = React.useRef(0);

  const onDragEnter = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (dragCounter.current === 0) {
      setDragOver(true);
    }
    dragCounter.current += 1;
  }, [dragCounter]);
  const onDragLeave = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setDragOver(false);
    }
  }, [dragCounter]);
  const onDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  const onDrop = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);
    self.current.onDrop(event);
  }, [self, dragCounter]);

  return {
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  };
}


export function Dropable (props: React.PropsWithChildren<IDropablePropsType>) {
  const { children } = props;
  const [dragOver, setDragOver] = React.useState(false);
  const classes = useDropableStyles();
  const {
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  } = useDropActions(props, setDragOver);
  return (
    <div
      className={clsx(classes.dropable, {
        [classes.dragOver]: dragOver,
      })}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}
