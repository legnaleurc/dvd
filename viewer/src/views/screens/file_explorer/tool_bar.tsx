import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
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
import { IGlobalStateType } from '@/states/reducers';
import { postSync, setSortFunction } from '@/states/file_system/actions';
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
  updating: boolean;
  currentKey: string;
  sync: () => void;
  setSortFunction: (key: string) => void;
}
function ToolBar (props: IToolBar) {
  const { updating, setSortFunction, currentKey } = props;

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
            aria-controls="file-menu"
            aria-haspopup="true"
          >
            <MoreVertIcon />
          </IconButton>
          <IconButton
            className={classes.icon}
            disabled={updating}
            onClick={props.sync}
          >
            <RefreshIcon />
          </IconButton>
        </div>

        <Menu
          id="file-menu"
          open={menuOpen}
          keepMounted={true}
          anchorEl={menuButtonRef.current}
          onClose={closeMenu}
        >
          {SORT_MENU_LIST.map((menu) => (
            <MenuItem
              key={menu.value}
              value={menu.value}
              selected={menu.value === currentKey}
              onClick={() => {
                setSortFunction(menu.value);
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
const ConnectedToolBar = (() => {
  function mapStateToProps (state: IGlobalStateType) {
    return {
      updating: state.fileSystem.updating,
      currentKey: state.fileSystem.sortKey,
    };
  }

  function mapDispatchToProps (dispatch: Dispatch) {
    return {
      sync () {
        dispatch(postSync());
      },
      setSortFunction (key: string) {
        dispatch(setSortFunction(key));
      },
    };
  }

  return connect(mapStateToProps, mapDispatchToProps)(ToolBar);
})();
export { ConnectedToolBar as FileExplorerToolBar };
