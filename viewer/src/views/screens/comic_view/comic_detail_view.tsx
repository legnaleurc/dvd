import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ImportContacts as ImportContactsIcon } from '@material-ui/icons';

import { getMixins } from '@/lib';
import { useFullScreenAction } from '@/views/hooks/fullscreen';
import { ComicDict, useComicState } from '@/views/hooks/comic';
import { useComicParams } from '@/views/hooks/router';
import { ImageView } from './image_view';


const useStyles = makeStyles((theme) => ({
  comicDetailView: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'y-scroll',
    ]),
  },
}));


export function ComicDetailView (props: {}) {
  const root = React.useRef<HTMLDivElement>(null);
  const classes = useStyles();
  const { toggleFullScreen } = useFullScreenAction();
  const { imageList } = useActions();

  return (
    <div
      className={classes.comicDetailView}
      ref={root}
      onClick={toggleFullScreen}
    >
      {imageList.map((d, index) => (
        <React.Fragment key={index}>
          <ImageView
            rootRef={root}
            width={d.width}
            height={d.height}
            url={d.url}
          />
        </React.Fragment>
      ))}
    </div>
  );
}


function useActions () {
  const { comicId } = useComicParams();
  const { comicDict } = useComicState();

  const imageList = getImageList(comicDict, comicId);

  return {
    imageList,
  };
}


function getImageList (comicDict: ComicDict, id: string) {
  if (comicDict[id]) {
    return comicDict[id].imageList;
  }
  return [];
}


export { ImportContactsIcon as ComicViewIcon };
