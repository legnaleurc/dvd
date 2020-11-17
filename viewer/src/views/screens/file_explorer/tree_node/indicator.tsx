import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  HourglassFull as HourglassFullIcon,
} from '@material-ui/icons';
import clsx from 'clsx';

import { useInstance } from '@/lib';
import { Node_, isLoaded, isLoading } from '@/views/hooks/file_system';
import { INDICATOR_SIZE } from './types';


const useStyles = makeStyles((theme) => ({
  indicator: {
    lineHeight: 0,
  },
  icon: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
  },
  spin: {
    animation: '$spin 4s linear infinite',
  },
  '@keyframes spin': {
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}));


interface IMaybeIndicatorProps {
  node: Node_;
  expanded: boolean;
  toggle: () => void;
  getChildren: (id: string) => Promise<void>;
}
export function MaybeIndicator (props: IMaybeIndicatorProps) {
  const { node, expanded } = props;

  const classes = useStyles();
  const self = useInstance(() => ({
    async toggle () {
      const { node, toggle, getChildren } = props;
      toggle();
      if (!isLoaded(node) && !isLoading(node)) {
        await getChildren(node.id);
      }
    },
  }), [
    props.node,
    props.getChildren,
    props.toggle,
  ]);

  const onClickIndicator = React.useCallback(async (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    await self.current.toggle();
  }, [self]);

  if (!node.children) {
    return null;
  }

  if (isLoading(node)) {
    return (
      <div className={classes.indicator}>
        <HourglassFullIcon className={clsx(classes.icon, classes.spin)} />
      </div>
    );
  }

  return (
    <div
      role="button"
      onClick={onClickIndicator}
      className={classes.indicator}
    >
      {expanded ? (
        <ExpandMoreIcon className={classes.icon} />
      ) : (
        <ChevronRightIcon className={classes.icon} />
      )}
    </div>
  );
}
