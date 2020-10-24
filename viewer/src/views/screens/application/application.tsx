import React from 'react';
import { RouteComponentProps } from 'react-router';

import { useFullScreenAction } from '@/views/hooks/fullscreen';
import { Header } from './header';
import { SideBar } from './side_bar';
import { Content } from './content';
import { useSiteMap, ISiteChunk } from './site_map';
// NOTE need to be the last for correct CSS order
import { useStyles } from './hooks';


interface MatchParams {
  tabId: string;
}
type IProps = RouteComponentProps<MatchParams>
export function Application (props: IProps) {
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


function useTabState (props: IProps, siteMap: ISiteChunk[]) {
  const { match, history } = props;
  const tabList = siteMap.map(chunk => chunk.id);
  const tabId = match.params.tabId;
  const tabIndex = tabList.indexOf(tabId);

  const changeTab = React.useCallback((newValue: number) => {
    history.push(`/${tabList[newValue]}`);
  }, [history, siteMap]);

  const { leaveFullScreen } = useFullScreenAction();

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
