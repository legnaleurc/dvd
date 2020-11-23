import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemText } from '@material-ui/core';

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
}));


export function ComicList () {
  const classes = useStyles();
  const { idList } = useComicState();

  return (
    <div className={classes.comicList}>
      <List>
        {idList.map((id) => (
          <ComicListItem key={id} id={id} />
        ))}
      </List>
    </div>
  );
}


interface IComicListItem {
  id: string;
}
function ComicListItem (props: IComicListItem) {
  const { relGoTo } = useNavigation();
  const { comicDict } = useComicState();
  const { id } = props;

  const onClick = React.useCallback(() => {
    relGoTo(`/${id}`);
  }, [relGoTo, id]);

  return (
    <ListItem
      button={true}
      onClick={onClick}
    >
      <ListItemText primary={comicDict[id].name} />
    </ListItem>
  );
}
