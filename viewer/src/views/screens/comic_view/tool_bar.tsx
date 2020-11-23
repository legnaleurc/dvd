import React from 'react';
import { Typography, Portal } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins } from '@/lib';
import { useComicState } from '@/views/hooks/comic';
import { ComicRoute, useComicParams } from '@/views/hooks/router';


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
            <ComicRoute
              defaultComponent={EmptyTitle}
              component={ComicTitle}
            />
          </Typography>
        </div>
      </div>
    </Portal>
  );
}
export { ToolBar as ComicViewToolBar };


function EmptyTitle () {
  return <></>;
}


function ComicTitle () {
  const { comicId } = useComicParams();
  const { comicDict } = useComicState();
  if (!comicDict[comicId]) {
    return <></>;
  }
  return <>{comicDict[comicId].name}</>;
}
