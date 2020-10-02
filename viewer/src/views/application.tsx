import React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Hidden,
} from '@material-ui/core';
import {
  ThemeProvider,
  createMuiTheme,
  makeStyles,
} from '@material-ui/core/styles';
import { Menu as MenuIcon } from '@material-ui/icons';
import clsx from 'clsx';

import { getMixins } from '@/lib';
import { DesktopDrawerMenu, MobileDrawerMenu } from './widgets/main_menu';
import { useSiteMap, ISiteChunk } from './site_map';
import {
  FullScreenProvider,
  useFullScreen,
} from '@/views/hooks/fullscreen';


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
    [theme.breakpoints.up('sm')]: {
      zIndex: theme.zIndex.drawer + 1,
    },
  },
  tail: {
    ...getMixins([
      'vbox',
    ]),
    flexGrow: 1,
  },
  tabPanel: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'vbox',
    ]),
  },
  mobileMenuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  desktopMenuButton: {
    display: 'none',
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'initial',
    },
  },
  toolBar: theme.mixins.toolbar,
  drawer: {
    [theme.breakpoints.up('sm')]: {
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
}));
type Classes = ReturnType<typeof useStyles>;


interface MatchParams {
  tabId: string;
}
type IApplicationProps = RouteComponentProps<MatchParams>
function Application (props: IApplicationProps) {
  const classes = useStyles();
  const siteMap = useSiteMap();
  const { tabIndex, changeTab } = useTabState(props, siteMap);
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


interface IHeaderProps {
  classes: Classes;
  toggleMobileDrawer: () => void;
  toggleDesktopDrawer: () => void;
  toolBarRef: React.RefObject<HTMLDivElement>;
}
function Header (props: IHeaderProps) {
  const {
    classes,
    toggleMobileDrawer,
    toggleDesktopDrawer,
    toolBarRef,
  } = props;
  const { fullScreen } = useFullScreen();
  return (
    <AppBar
      position="fixed"
      className={clsx(classes.head, {
        [classes.hidden]: fullScreen,
      })}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          className={classes.mobileMenuButton}
          onClick={toggleMobileDrawer}
        >
          <MenuIcon />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          className={classes.desktopMenuButton}
          onClick={toggleDesktopDrawer}
        >
          <MenuIcon />
        </IconButton>
        <div className={classes.screenToolBar} ref={toolBarRef} />
      </Toolbar>
    </AppBar>
  );
}


interface ISideBarProps {
  classes: Classes;
  siteMap: ISiteChunk[];
  tabIndex: number;
  changeTab: (index: number) => void;
  mobileOpen: boolean;
  toggleMobileDrawer: () => void;
  desktopOpen: boolean;
  closeDesktopDrawer: () => void;
}
function SideBar (props: ISideBarProps) {
  const {
    classes,
    siteMap,
    tabIndex,
    changeTab,
    mobileOpen,
    toggleMobileDrawer,
    desktopOpen,
    closeDesktopDrawer,
  } = props;
  const { fullScreen } = useFullScreen();
  return (
    <nav className={clsx(classes.drawer, {
      [classes.hidden]: fullScreen,
    })}>
      <Hidden smUp={true} implementation="css">
        <MobileDrawerMenu
          open={mobileOpen}
          closeMenu={toggleMobileDrawer}
          siteMap={siteMap}
          tabIndex={tabIndex}
          changeTab={changeTab}
        />
      </Hidden>
      <Hidden xsDown={true} implementation="css">
        <DesktopDrawerMenu
          open={desktopOpen}
          closeMenu={closeDesktopDrawer}
          siteMap={siteMap}
          tabIndex={tabIndex}
          changeTab={changeTab}
        />
      </Hidden>
    </nav>
  );
}


interface IContentProps {
  classes: Classes;
  siteMap: ISiteChunk[];
  tabIndex: number;
  toolBarEl?: HTMLDivElement;
}
function Content (props: IContentProps) {
  const { classes, siteMap, tabIndex, toolBarEl } = props;
  const { fullScreen } = useFullScreen();
  return (
    <Box className={classes.tail}>
      <div
        className={clsx(classes.toolBar, {
          [classes.hidden]: fullScreen,
        })}
      />
      {siteMap.map((chunk, index) => (
        <TabPanel
          key={chunk.id}
          classes={classes}
          index={index}
          value={tabIndex}
        >
          <chunk.context>
            <chunk.main />
            <chunk.toolBar
              anchorEl={index === tabIndex ? toolBarEl : undefined}
            />
          </chunk.context>
        </TabPanel>
      ))}
    </Box>
  );
}


interface TabPanelProps {
  index: number;
  value: number;
  classes: Classes;
}
function TabPanel (props: React.PropsWithChildren<TabPanelProps>) {
  const { children, classes, value, index } = props;
  return (
    <div className={clsx(classes.tabPanel, {
      [classes.hidden]: value !== index,
    })}>
      {children}
    </div>
  );
}


function useTabState (props: IApplicationProps, siteMap: ISiteChunk[]) {
  const { match, history } = props;
  const tabList = siteMap.map(chunk => chunk.id);
  const tabId = match.params.tabId;
  const tabIndex = tabList.indexOf(tabId);

  const changeTab = React.useCallback((newValue: number) => {
    history.push(`/${tabList[newValue]}`);
  }, [history, siteMap]);

  const { leaveFullScreen } = useFullScreen();

  React.useEffect(() => {
    return history.listen(() => {
      leaveFullScreen();
    });
  }, [history, leaveFullScreen]);

  return {
    tabIndex,
    changeTab,
  };
}


function RoutedApplication (props: {}) {
  return (
    <BrowserRouter>
      <Switch>
        <Redirect exact from="/" to="/files" />
        <Route
          path="/:tabId"
          component={Application}
        />
      </Switch>
    </BrowserRouter>
  );
}


function FullscreenApplication (props: {}) {
  return (
    <FullScreenProvider>
      <RoutedApplication />
    </FullScreenProvider>
  );
}


const gTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
  typography: {
    fontSize: 16,
  },
});


function ThemedApplication (props: {}) {
  return (
    <ThemeProvider theme={gTheme}>
      <FullscreenApplication />
    </ThemeProvider>
  );
}


const HotApplication = hot(ThemedApplication);
export { HotApplication as Application };
