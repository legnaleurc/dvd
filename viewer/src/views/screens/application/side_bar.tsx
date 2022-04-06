import React from 'react';
import clsx from 'clsx';

import { useFullScreenState } from '@/views/hooks/fullscreen';
import { DesktopDrawerMenu, MobileDrawerMenu } from './main_menu';
import { ISiteChunk } from './site_map';


interface IClasses {
  drawer: string;
  hidden: string;
  mobileOnlyBlock: string;
  desktopOnlyBlock: string;
}
interface IProps {
  classes: IClasses;
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
  const { fullScreen } = useFullScreenState();
  return (
    <nav className={clsx(classes.drawer, {
      [classes.hidden]: fullScreen,
    })}>
      <div className={classes.mobileOnlyBlock}>
        <MobileDrawerMenu
          open={mobileOpen}
          closeMenu={toggleMobileDrawer}
          siteMap={siteMap}
          tabIndex={tabIndex}
          changeTab={changeTab}
        />
      </div>
      <div className={classes.desktopOnlyBlock}>
        <DesktopDrawerMenu
          open={desktopOpen}
          closeMenu={closeDesktopDrawer}
          siteMap={siteMap}
          tabIndex={tabIndex}
          changeTab={changeTab}
        />
      </div>
    </nav>
  );
}
