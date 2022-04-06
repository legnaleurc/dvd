import React from 'react';
import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import { MAIN_MENU_WIDTH } from '@/lib';
import { ISiteChunk } from './site_map';


const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    width: MAIN_MENU_WIDTH,
  },
  toolBar: {
    ...theme.mixins.toolbar,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
  },
  drawerContent: {},
  drawer: {
    width: MAIN_MENU_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: MAIN_MENU_WIDTH,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
  },
  drawerClose: {
    width: theme.spacing(7) + 1,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
  },
}));
type Classes = ReturnType<typeof useStyles>;


interface IDrawerMenuProps {
  open: boolean;
  closeMenu: () => void;
  siteMap: ISiteChunk[];
  tabIndex: number;
  changeTab: (newValue: number) => void,
}


interface IMobileDrawerMenuProps extends IDrawerMenuProps {
}
export function MobileDrawerMenu (props: IMobileDrawerMenuProps) {
  const classes = useStyles();
  const onChangeTab = React.useCallback((newValue: number) => {
    props.changeTab(newValue);
    props.closeMenu();
  }, [props.closeMenu, props.changeTab]);
  return (
    <Drawer
      variant="temporary"
      classes={{
        root: 'pwa-hack-drawer-root',
        paper: clsx('pwa-hack-drawer-paper', classes.drawerPaper),
      }}
      open={props.open}
      anchor="left"
      onClose={props.closeMenu}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <DrawerContent
        siteMap={props.siteMap}
        classes={classes}
        tabIndex={props.tabIndex}
        changeTab={onChangeTab}
      />
    </Drawer>
  );
}


interface IDesktopDrawerMenuProps extends IDrawerMenuProps {
}
export function DesktopDrawerMenu (props: IDesktopDrawerMenuProps) {
  const classes = useStyles();
  const onChangeTab = React.useCallback((newValue: number) => {
    props.changeTab(newValue);
    props.closeMenu();
  }, [props.closeMenu, props.changeTab]);
  return (
    <Drawer
      variant="permanent"
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: props.open,
        [classes.drawerClose]: !props.open,
      })}
      classes={{
        paper: clsx({
          [classes.drawerOpen]: props.open,
          [classes.drawerClose]: !props.open,
        }),
      }}
    >
      <DrawerContent
        siteMap={props.siteMap}
        classes={classes}
        tabIndex={props.tabIndex}
        changeTab={onChangeTab}
      />
    </Drawer>
  );
}


interface IDrawerContentProps {
  siteMap: ISiteChunk[];
  classes: Classes;
  tabIndex: number;
  changeTab: (newValue: number) => void,
}
function DrawerContent (props: IDrawerContentProps) {
  const { classes, siteMap, tabIndex, changeTab } = props;
  return (
    <div className={classes.drawerContent}>
      <div className={classes.toolBar} />
      <Divider />
      <List>
        {siteMap.map((chunk, index) => (
          <ListItem
            key={chunk.id}
            button={true}
            selected={tabIndex === index}
            onClick={event => changeTab(index)}
          >
            <ListItemIcon><chunk.icon /></ListItemIcon>
            <ListItemText primary={chunk.name} />
          </ListItem>
        ))}
      </List>
    </div>
  );
}
