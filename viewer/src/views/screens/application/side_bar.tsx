import React from 'react';
import { Hidden } from '@material-ui/core';
import clsx from 'clsx';

import { useFullScreen } from '@/views/hooks/fullscreen';
import { Classes } from './hooks';
import { DesktopDrawerMenu, MobileDrawerMenu } from './main_menu';
import { ISiteChunk } from './site_map';


interface IProps {
  classes: Classes;
  siteMap: ISiteChunk[];
  tabIndex: number;
  changeTab: (index: number) => void;
  mobileOpen: boolean;
  toggleMobileDrawer: () => void;
  desktopOpen: boolean;
  closeDesktopDrawer: () => void;
}
export function SideBar (props: IProps) {
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
