import React from 'react';

import { ComicRoute } from '@/views/hooks/router';
import { ComicList } from './comic_list';
import { ComicDetailView } from './comic_detail_view';


export function ComicView (props: {}) {
  return (
    <ComicRoute
      defaultComponent={ComicList}
      component={ComicDetailView}
    />
  );
}
