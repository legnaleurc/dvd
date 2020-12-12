import React from 'react';

import { ComicRoute } from '@/views/hooks/router';
import { ComicList } from './comic_list';
import { ImageList } from './image_list';


export function ComicView (props: {}) {
  return (
    <ComicRoute
      defaultComponent={ComicList}
      component={ImageList}
    />
  );
}
