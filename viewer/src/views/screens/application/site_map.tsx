import React from 'react';

import {
  FileExplorer,
  FileExplorerContextProvider,
  FileExplorerIcon,
  FileExplorerToolBar,
} from '@/views/screens/file_explorer';
import {
  MultiPageView,
  MultiPageViewIcon,
  MultiPageViewToolBar,
} from '@/views/screens/multipage_view';
import {
  SearchView,
  SearchViewProvider,
  SearchViewIcon,
  SearchViewToolBar,
} from '@/views/screens/search_view';
import {
  SettingsView,
  SettingsViewIcon,
  SettingsViewToolBar,
} from '@/views/screens/settings_view';


interface IToolBarProps {
  anchorEl?: HTMLDivElement;
}


export interface ISiteChunk {
  id: string;
  name: string;
  icon: React.ElementType<{}>;
  context: React.ElementType<React.PropsWithChildren<{}>>;
  main: React.ElementType<{}>;
  toolBar: React.ElementType<IToolBarProps>;
}
export function useSiteMap (): ISiteChunk[] {
  const siteMap = React.useRef([
    {
      id: 'files',
      name: 'File Explorer',
      icon: FileExplorerIcon,
      context: FileExplorerContextProvider,
      main: FileExplorer,
      toolBar: FileExplorerToolBar,
    },
    {
      id: 'mpv',
      name: 'Multi-page Viewer',
      icon: MultiPageViewIcon,
      context: React.Fragment,
      main: MultiPageView,
      toolBar: MultiPageViewToolBar,
    },
    {
      id: 'search',
      name: 'Search',
      icon: SearchViewIcon,
      context: SearchViewProvider,
      main: SearchView,
      toolBar: SearchViewToolBar,
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: SettingsViewIcon,
      context: React.Fragment,
      main: SettingsView,
      toolBar: SettingsViewToolBar,
    },
  ]);
  return siteMap.current;
}