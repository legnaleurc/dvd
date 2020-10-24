import { makeStyles } from '@material-ui/core/styles';

import { getMixins } from '@/lib';


export const useStyles = makeStyles((theme) => ({
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
  fakeToolBar: theme.mixins.toolbar,
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
export type Classes = ReturnType<typeof useStyles>;
