import React from 'react';
import { Typography, Portal, IconButton } from '@material-ui/core';
import { SyncAlt as SyncIcon } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins } from '@/lib';
import { useComicState, useComicAction } from '@/views/hooks/comic';
import { ComicRoute, useComicParams } from '@/views/hooks/router';


const useStyles = makeStyles((theme) => ({
  multiPageViewToolBar: {
    ...getMixins([
      'size-grow',
      'hbox',
    ]),
  },
  titleGroup: {
    ...getMixins([
      'size-grow',
      'hbox',
    ]),
    alignItems: 'center',
  },
  buttonGroup: {
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
        <div className={classes.titleGroup}>
          <Typography variant="h6" noWrap>
            <ComicRoute
              defaultComponent={EmptyBlock}
              component={ComicTitle}
            />
          </Typography>
        </div>
        <div className={classes.buttonGroup}>
          <ComicRoute
            defaultComponent={ButtonGroup}
            component={EmptyBlock}
          />
        </div>
      </div>
    </Portal>
  );
}
export { ToolBar as ComicViewToolBar };


function EmptyBlock (props: {}) {
  return <></>;
}


function ButtonGroup (props: {}) {
  const { loadCache } = useComicAction();
  return (
    <div>
      <IconButton
        onClick={loadCache}
      >
        <SyncIcon />
      </IconButton>
    </div>
  );
}


function ComicTitle () {
  const { comicId } = useComicParams();
  const { comicDict } = useComicState();
  if (!comicDict[comicId]) {
    return <></>;
  }
  return <>{comicDict[comicId].name}</>;
}
