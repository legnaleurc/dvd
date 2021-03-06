import React from 'react';

const FileExplorer = React.lazy(() => import('./lazy/file_explorer'));
const FileExplorerProvider = React.lazy(() => import('./lazy/file_explorer_provider'));
const FileExplorerIcon = React.lazy(() => import('./lazy/file_explorer_icon'));
const FileExplorerToolBar = React.lazy(() => import('./lazy/file_explorer_tool_bar'));
const ComicView = React.lazy(() => import('./lazy/comic_view'));
const ComicViewIcon = React.lazy(() => import('./lazy/comic_view_icon'));
const ComicViewToolBar = React.lazy(() => import('./lazy/comic_view_tool_bar'));
const SearchView = React.lazy(() => import('./lazy/search_view'));
const SearchViewProvider = React.lazy(() => import('./lazy/search_view_provider'));
const SearchViewIcon = React.lazy(() => import('./lazy/search_view_icon'));
const SearchViewToolBar = React.lazy(() => import('./lazy/search_view_tool_bar'));
const SettingsView = React.lazy(() => import('./lazy/settings_view'));
const SettingsViewIcon = React.lazy(() => import('./lazy/settings_view_icon'));
const SettingsViewToolBar = React.lazy(() => import('./lazy/settings_view_tool_bar'));


interface IToolBarProps {
  anchorEl?: HTMLDivElement;
}


export interface ISiteChunk {
  id: string;
  name: string;
  icon: React.ComponentType<{}>;
  context: React.ComponentType<{}>;
  main: React.ComponentType<{}>;
  toolBar: React.ComponentType<IToolBarProps>;
}
export function useSiteMap (): ISiteChunk[] {
  const siteMap = React.useRef([
    {
      id: 'files',
      name: 'File Explorer',
      icon: FileExplorerIcon,
      context: FileExplorerProvider,
      main: FileExplorer,
      toolBar: FileExplorerToolBar,
    },
    {
      id: 'comic',
      name: 'Comic Viewer',
      icon: ComicViewIcon,
      context: React.Fragment,
      main: ComicView,
      toolBar: ComicViewToolBar,
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
