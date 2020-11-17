import React from 'react';
import {
  FormControlLabel,
  FormGroup,
  Hidden,
  IconButton,
  Menu,
  MenuItem,
  Portal,
  Switch,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@material-ui/icons';

import { getMixins } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { useContext } from './hooks';
import { SORT_MENU_LIST } from './types';


const useStyles = makeStyles((theme) => ({
  fileExplorerToolBar: {
    ...getMixins([
      'size-grow',
      'hbox',
    ]),
  },
  group: {
    ...getMixins([
      'size-shrink',
      'hbox',
    ]),
    alignItems: 'center',
  },
  expand: {
    ...getMixins([
      'size-grow',
    ]),
  },
  icon: {},
}));


interface IToolBar {
  anchorEl?: HTMLDivElement;
}
export function ToolBar (props: IToolBar) {
  const { syncing, sortKey } = useFileSystemState();
  const { sync, setSortKey } = useFileSystemAction();
  const classes = useStyles();
  const { two, toggle } = useContext();
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const openMenu = React.useCallback(() => {
    setMenuOpen(true);
  }, [setMenuOpen]);
  const closeMenu = React.useCallback(() => {
    setMenuOpen(false);
  }, [setMenuOpen]);

  if (!props.anchorEl) {
    return null;
  }

  return (
    <Portal container={props.anchorEl}>
      <div className={classes.fileExplorerToolBar}>
        <div className={classes.group}>
          <Typography variant="h6" noWrap>
            File Explorer
          </Typography>
        </div>
        <div className={classes.expand} />
        <div className={classes.group}>
          <Hidden xsDown={true} implementation="css">
            <FormGroup row={true}>
              <FormControlLabel
                label="Two Column"
                control={
                  <Switch
                    checked={two}
                    onChange={toggle}
                  />
                }
              />
            </FormGroup>
          </Hidden>
        </div>
        <div className={classes.group}>
          <IconButton
            ref={menuButtonRef}
            className={classes.icon}
            onClick={openMenu}
            aria-controls="file-explorer-menu"
            aria-haspopup="true"
          >
            <MoreVertIcon />
          </IconButton>
          <IconButton
            className={classes.icon}
            disabled={syncing}
            onClick={sync}
          >
            <RefreshIcon />
          </IconButton>
        </div>

        <Menu
          id="file-explorer-menu"
          open={menuOpen}
          keepMounted={true}
          anchorEl={menuButtonRef.current}
          onClose={closeMenu}
        >
          {SORT_MENU_LIST.map((menu) => (
            <MenuItem
              key={menu.value}
              value={menu.value}
              selected={menu.value === sortKey}
              onClick={() => {
                closeMenu();
                setSortKey(menu.value);
              }}
            >
              {menu.name}
            </MenuItem>
          ))}
        </Menu>
      </div>
    </Portal>
  );
}
