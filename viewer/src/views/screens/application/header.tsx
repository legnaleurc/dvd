import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
} from '@material-ui/core';
import { Menu as MenuIcon } from '@material-ui/icons';
import clsx from 'clsx';

import { useFullScreenState } from '@/views/hooks/fullscreen';


interface IClasses {
  head: string;
  hidden: string;
  toolBar: string;
  mobileOnlyBlock: string;
  desktopOnlyBlock: string;
  headerMenuButton: string;
  screenToolBar: string;
}
interface IProps {
  classes: IClasses;
  toggleMobileDrawer: () => void;
  toggleDesktopDrawer: () => void;
  toolBarRef: React.RefObject<HTMLDivElement>;
}
export function Header (props: IProps) {
  const {
    classes,
    toggleMobileDrawer,
    toggleDesktopDrawer,
    toolBarRef,
  } = props;
  const { fullScreen } = useFullScreenState();
  return (
    <AppBar
      position="fixed"
      color="transparent"
      className={clsx(
        'pwa-hack-header',
        classes.head,
        {
          [classes.hidden]: fullScreen,
        },
      )}
    >
      <Toolbar className={classes.toolBar}>
        <div className={classes.headerMenuButton}>
          <div className={classes.mobileOnlyBlock}>
            <IconButton
              color="inherit"
              aria-label="open mobile drawer"
              edge="start"
              onClick={toggleMobileDrawer}
            >
              <MenuIcon />
            </IconButton>
          </div>
          <div className={classes.desktopOnlyBlock}>
            <IconButton
              color="inherit"
              aria-label="open desktop drawer"
              edge="start"
              onClick={toggleDesktopDrawer}
            >
              <MenuIcon />
            </IconButton>
          </div>
        </div>
        <div className={classes.screenToolBar} ref={toolBarRef} />
      </Toolbar>
    </AppBar>
  );
}
