import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ExpandMore, ChevronRight } from '@material-ui/icons';

import { useInstance } from '@/lib';
import { Node } from '@/views/hooks/file_system';
import { INDICATOR_SIZE } from './types';


const useStyles = makeStyles((theme) => ({
  indicator: {
    lineHeight: 0,
    '& > $icon': {
      width: INDICATOR_SIZE,
      height: INDICATOR_SIZE,
    },
  },
  icon: {},
}));


interface IMaybeIndicatorProps {
  node: Node;
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
      if (!node.fetched) {
        await getChildren(node.id);
      }
      toggle();
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
  return (
    <div
      onClick={onClickIndicator}
      className={classes.indicator}
    >
      {expanded ? (
        <ExpandMore className={classes.icon} />
      ) : (
        <ChevronRight className={classes.icon} />
      )}
    </div>
  );
}
