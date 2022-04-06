import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { getMixins } from '@/lib';
import { useFullScreenAction } from '@/views/hooks/fullscreen';
import { useRootParams, useNavigation } from '@/views/hooks/router';
import { Header } from './header';
import { SideBar } from './side_bar';
import { Content } from './content';
import { useSiteMap, ISiteChunk } from './site_map';


const useStyles = makeStyles((theme) => ({
  application: {
    ...getMixins([
      'hbox',
      'w-100',
      'h-100',
    ]),
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.default,
  },
  head: {
    [theme.breakpoints.up('md')]: {
      zIndex: theme.zIndex.drawer + 1,
    },
  },
  tail: {
    ...getMixins([
      'vbox',
    ]),
    flexGrow: 1,
  },
  toolBar: {
    backgroundColor: theme.palette.background.paper,
  },
  tabPanel: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'vbox',
    ]),
  },
  headerMenuButton: {
    marginRight: theme.spacing(2),
  },
  fakeToolBar: theme.mixins.toolbar,
  drawer: {
    [theme.breakpoints.up('md')]: {
      width: theme.spacing(7) + 1,
      flexShrink: 0,
    },
  },
  screenToolBar: {
    ...getMixins([
      'size-grow',
      'hbox',
    ]),
  },
  hidden: {
    display: 'none',
  },
  mobileOnlyBlock: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  desktopOnlyBlock: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'block',
    },
  },
}));


export function Application (props: {}) {
  const classes = useStyles();
  const siteMap = useSiteMap();
  const { tabIndex, changeTab } = useTabState(siteMap);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(false);
  const toolBarRef = React.useRef<HTMLDivElement>(null);
  const [toolBarEl, setToolBarEl] = React.useState<HTMLDivElement | undefined>();

  const toggleMobileDrawer = React.useCallback(() => {
    setMobileOpen(!mobileOpen);
  }, [mobileOpen, setMobileOpen]);
  const toggleDesktopDrawer = React.useCallback(() => {
    setDesktopOpen(!desktopOpen);
  }, [desktopOpen, setDesktopOpen]);
  const closeDesktopDrawer = React.useCallback(() => {
    setDesktopOpen(false);
  }, [setDesktopOpen]);

  React.useEffect(() => {
    if (toolBarRef.current) {
      setToolBarEl(toolBarRef.current);
    }
  }, [toolBarRef.current]);

  return (
    <div className={classes.application}>
      <Header
        classes={classes}
        toggleMobileDrawer={toggleMobileDrawer}
        toggleDesktopDrawer={toggleDesktopDrawer}
        toolBarRef={toolBarRef}
      />
      <SideBar
        classes={classes}
        siteMap={siteMap}
        tabIndex={tabIndex}
        changeTab={changeTab}
        mobileOpen={mobileOpen}
        toggleMobileDrawer={toggleMobileDrawer}
        desktopOpen={desktopOpen}
        closeDesktopDrawer={closeDesktopDrawer}
      />
      <Content
        classes={classes}
        siteMap={siteMap}
        tabIndex={tabIndex}
        toolBarEl={toolBarEl}
      />
    </div>
  );
}


function useTabState (siteMap: ISiteChunk[]) {
  const { absGoTo, listenTo } = useNavigation();
  const { tabId } = useRootParams();
  const tabList = siteMap.map(chunk => chunk.id);
  const tabIndex = tabList.indexOf(tabId);

  const changeTab = React.useCallback((newValue: number) => {
    absGoTo(`/${tabList[newValue]}`);
  }, [absGoTo, siteMap]);

  const { leaveFullScreen } = useFullScreenAction();

  React.useEffect(() => {
    return listenTo(() => {
      leaveFullScreen();
    });
  }, [listenTo, leaveFullScreen]);

  return {
    tabIndex,
    changeTab,
  };
}
