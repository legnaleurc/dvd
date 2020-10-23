import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Search as SearchIcon } from '@material-ui/icons';

import { getMixins } from '@/lib';
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
  },
  desktopBlock: {
    ...getMixins([
      'size-grow',
      'mh-0',
    ]),
  },
  mobileBlock: {
    ...getMixins([
      'size-grow',
      'mh-0',
    ]),
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
      <Box
        className={classes.desktopBlock}
        display={{ xs: 'none', sm: 'flex' }}
      >
        <DesktopView />
      </Box>
      <Box
        className={classes.mobileBlock}
        display={{ xs: 'flex', sm: 'none' }}
      >
        <MobileView />
      </Box>
      <CompareDialog
        open={showCompareDialog}
        onClose={hideCompare}
      />
    </div>
  );
}


export { SearchIcon as SearchViewIcon };
