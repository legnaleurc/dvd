import React from 'react';

const FileExplorer = React.lazy(() => import('./lazy/file_explorer'));
const FileExplorerContextProvider = React.lazy(() => import('./lazy/file_explorer_context_provider'));
const FileExplorerIcon = React.lazy(() => import('./lazy/file_explorer_icon'));
const FileExplorerToolBar = React.lazy(() => import('./lazy/file_explorer_tool_bar'));
const MultiPageView = React.lazy(() => import('./lazy/multi_page'));
const MultiPageViewIcon = React.lazy(() => import('./lazy/multi_page_icon'));
const MultiPageViewToolBar = React.lazy(() => import('./lazy/multi_page_tool_bar'));
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

type Component<T> = React.ComponentType<React.PropsWithChildren<T>>;


export interface ISiteChunk {
  id: string;
  name: string;
  icon: Component<{}>;
  context: Component<{}>;
  main: Component<{}>;
  toolBar: Component<IToolBarProps>;
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
