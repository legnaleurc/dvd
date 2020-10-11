import React from 'react';
import { Portal, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins } from '@/lib';


const useStyles = makeStyles((theme) => ({
  settingsViewToolBar: {
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


interface IProps {
  anchorEl?: HTMLDivElement;
}
export function ToolBar (props: IProps) {
  const classes = useStyles();
  if (!props.anchorEl) {
    return null;
  }
  return (
    <Portal container={props.anchorEl}>
      <div className={classes.settingsViewToolBar}>
        <div className={classes.group}>
          <Typography variant="h6" noWrap>
            Settings
          </Typography>
        </div>
      </div>
    </Portal>
  );
}
