import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemText } from '@material-ui/core';
import clsx from 'clsx';

import { getMixins } from '@/lib';
import { useComicState } from '@/views/hooks/comic';
import { useNavigation } from '@/views/hooks/router';


const useStyles = makeStyles((theme) => ({
  comicList: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'y-scroll',
    ]),
  },
  unavailable: {
    textDecoration: 'line-through',
  },
}));
type Classes = ReturnType<typeof useStyles>;


export function ComicList () {
  const classes = useStyles();
  const { idList } = useComicState();

  return (
    <div className={classes.comicList}>
      <List>
        {idList.map((id) => (
          <ComicListItem key={id} classes={classes} id={id} />
        ))}
      </List>
    </div>
  );
}


interface IComicListItem {
  classes: Classes;
  id: string;
}
function ComicListItem (props: IComicListItem) {
  const { relGoTo } = useNavigation();
  const { comicDict } = useComicState();
  const { classes, id } = props;

  const onClick = React.useCallback(() => {
    relGoTo(`/${id}`);
  }, [relGoTo, id]);

  const isReady = !comicDict[id].unpacking;
  const unavailable = isReady && comicDict[id].imageList.length <= 0;

  return (
    <ListItem
      button={true}
      disabled={!isReady || unavailable}
      className={clsx({
        [classes.unavailable]: unavailable,
      })}
      onClick={onClick}
    >
      <ListItemText primary={comicDict[id].name} />
    </ListItem>
  );
}
