import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import { useInstance } from '@/lib';


const useStyles = makeStyles((theme) => ({
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


interface IProps {
  onDrop: React.DragEventHandler<HTMLDivElement>;
}


function useActions (
  props: IProps,
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


export function Dropable (props: React.PropsWithChildren<IProps>) {
  const { children } = props;
  const [dragOver, setDragOver] = React.useState(false);
  const classes = useStyles();
  const {
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  } = useActions(props, setDragOver);
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
