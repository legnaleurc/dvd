import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
} from '@material-ui/core';
import { Menu as MenuIcon } from '@material-ui/icons';
import clsx from 'clsx';

import { useFullScreenState } from '@/views/hooks/fullscreen';
import { Classes } from './hooks';


interface IProps {
  classes: Classes;
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
      className={clsx(classes.head, {
        [classes.hidden]: fullScreen,
      })}
    >
      <Toolbar className={classes.toolBar}>
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
