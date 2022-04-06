import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Search as SearchIcon } from '@material-ui/icons';

import { getMixins, FONT_FAMILY } from '@/lib';
import { useContext } from './context';
import { DesktopView } from './desktop_view';
import { MobileView } from './mobile_view';
import { CompareDialog } from './compare_dialog';


const useStyles = makeStyles((theme) => ({
  searchView: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'vbox',
    ]),
    fontFamily: FONT_FAMILY,
  },
  desktopBlock: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      ...getMixins([
        'vbox',
        'size-grow',
        'mh-0',
      ]),
    },
  },
  mobileBlock: {
    ...getMixins([
      'vbox',
      'size-grow',
      'mh-0',
    ]),
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
}));


export function SearchView (props: {}) {
  const classes = useStyles();
  const {
    showCompareDialog,
    hideCompare,
  } = useContext();
  return (
    <div className={classes.searchView}>
      <div className={classes.desktopBlock}>
        <DesktopView />
      </div>
      <div className={classes.mobileBlock}>
        <MobileView />
      </div>
      <CompareDialog
        open={showCompareDialog}
        onClose={hideCompare}
      />
    </div>
  );
}


export { SearchIcon as SearchViewIcon };
