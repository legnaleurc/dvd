import React from 'react';
import { Typography, Portal } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins } from '@/lib';


const useStyles = makeStyles((theme) => ({
  multiPageViewToolBar: {
    ...getMixins([
      'size-grow',
      'hbox',
    ]),
  },
  group: {
    ...getMixins([
      'size-shrink',
      'hbox',
    ]),
    alignItems: 'center',
  },
}));


interface IToolBar {
  anchorEl?: HTMLDivElement;
}
function ToolBar (props: IToolBar) {
  const classes = useStyles();
  if (!props.anchorEl) {
    return null;
  }
  return (
    <Portal container={props.anchorEl}>
      <div className={classes.multiPageViewToolBar}>
        <div className={classes.group}>
          <Typography variant="h6" noWrap>
            Multi-page Viewer
          </Typography>
        </div>
      </div>
    </Portal>
  );
}
export { ToolBar as MultiPageViewToolBar };
