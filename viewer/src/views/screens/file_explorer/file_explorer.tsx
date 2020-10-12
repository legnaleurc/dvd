import React from 'react';
import clsx from 'clsx';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Folder as FolderIcon } from '@material-ui/icons';

import { getMixins } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { TreeView } from './tree_view';
import { ListView } from './list_view';
import { useContext } from './hooks';


const useStyles = makeStyles((theme) => ({
  fileExplorer: {
    ...getMixins([
      'size-grow',
      'mh-0',
      'vbox',
    ]),
  },
  tail: {
    ...getMixins([
      'size-grow',
      // 'w-100',
      // IMPORTANT set min-height to have scroll for children
      'mh-0',
      'hbox',
    ]),
  },
  desktop: {
    ...getMixins([
      'size-grow',
      'mh-0',
    ]),
    '& > $group': {
      ...getMixins([
        'w-100',
        'h-100',
        'no-scroll',
      ]),
    },
    '&$even > $group': {
      ...getMixins([
        'w-50',
      ]),
    },
  },
  mobile: {
    ...getMixins([
      'size-grow',
      'mh-0',
    ]),
    flexDirection: 'column',
    '& > $group': {
      ...getMixins([
        'size-grow',
        'mh-0',
        'vbox',
      ]),
    },
  },
  group: {},
  even: {},
}));


export function FileExplorer (props: {}) {
  const { loadRoot } = useFileSystemAction();
  const { rootId } = useFileSystemState();
  const classes = useStyles();
  const { two } = useContext();

  React.useEffect(() => {
    loadRoot();
  }, []);

  return (
    <div className={classes.fileExplorer}>
      <div className={classes.tail}>
        <Box
          className={clsx(classes.desktop, {
            [classes.even]: two,
          })}
          display={{ xs: 'none', sm: 'flex' }}
        >
          <div className={classes.group}>
            <TreeView rootId={rootId} />
          </div>
          <SecondTreeView rootId={rootId} two={two} />
        </Box>
        <Box
          className={classes.mobile}
          display={{ xs: 'flex', sm: 'none' }}
        >
          <div className={classes.group}>
            <ListView rootId={rootId} />
          </div>
        </Box>
      </div>
    </div>
  );
}


interface ISecondTreeView {
  two: boolean;
  rootId: string | null;
}
function SecondTreeView (props: ISecondTreeView) {
  const classes = useStyles();
  if (!props.two) {
    return null;
  }
  return (
    <div className={classes.group}>
      <TreeView rootId={props.rootId} />
    </div>
  );
}


export { FolderIcon as FileExplorerIcon };
