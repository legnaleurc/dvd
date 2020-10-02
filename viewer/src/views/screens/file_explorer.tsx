import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import clsx from 'clsx';
import {
  Box,
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
  Folder as FolderIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@material-ui/icons';

import { IGlobalStateType } from '@/states/reducers';
import { postSync, setSortFunction } from '@/states/file_system/actions';
import { TreeView } from '@/views/widgets/tree_view';
import { ListView } from '@/views/widgets/list_view';
import { getMixins } from '@/lib';
import {
  SORT_BY_NAME_ASC,
  SORT_BY_MTIME_ASC,
  SORT_BY_MTIME_DES,
} from '@/states/file_system/sort';


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


interface IActionType {
  type: string;
}
interface IStateType {
  two: boolean;
}
function reducer (state: IStateType, action: IActionType) {
  switch (action.type) {
    case 'TOGGLE':
      return {
        ...state,
        two: !state.two,
      };
    default:
      return state;
  }
}


const Context = React.createContext({
  two: false,
  dispatch: (action: IActionType) => {},
});


export function useFileExplorerContext () {
  const state = React.useContext(Context);
  return state;
}


export function FileExplorerContextProvider (props: React.PropsWithChildren<{}>) {
  const [state, dispatch] = React.useReducer(reducer, {
    two: false,
  });
  return (
    <Context.Provider value={{
      ...state,
      dispatch,
    }}>
      {props.children}
    </Context.Provider>
  );
}


interface IPropsType {
  rootId: string | null;
}
function FileExplorer (props: IPropsType) {
  const classes = useStyles();
  const { two } = useFileExplorerContext();

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
            <TreeView rootId={props.rootId} />
          </div>
          <SecondTreeView rootId={props.rootId} two={two} />
        </Box>
        <Box
          className={classes.mobile}
          display={{ xs: 'flex', sm: 'none' }}
        >
          <div className={classes.group}>
            <ListView rootId={props.rootId} />
          </div>
        </Box>
      </div>
    </div>
  );
}
const ConnectedFileExplorer = (() => {
  function mapStateToProps (state: IGlobalStateType) {
    return {
      rootId: state.fileSystem.rootId,
    };
  }

  return connect(mapStateToProps)(FileExplorer);
})();
export { ConnectedFileExplorer as FileExplorer };


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


const useToolBarStyles = makeStyles((theme) => ({
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


const SORT_MENU_LIST = [
  {
    name: 'Sort By Name Asc',
    value: SORT_BY_NAME_ASC,
  },
  {
    name: 'Sort By Modified Time Asc',
    value: SORT_BY_MTIME_ASC,
  },
  {
    name: 'Sort By Modified Time Des',
    value: SORT_BY_MTIME_DES,
  },
];


interface IToolBar {
  anchorEl?: HTMLDivElement;
  updating: boolean;
  currentKey: string;
  sync: () => void;
  setSortFunction: (key: string) => void;
}
function ToolBar (props: IToolBar) {
  const { updating, setSortFunction, currentKey } = props;

  const classes = useToolBarStyles();
  const { two, dispatch } = useFileExplorerContext();
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const toggle = React.useCallback(() => {
    dispatch({ type: 'TOGGLE' });
  }, [dispatch]);

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


export { FolderIcon as FileExplorerIcon };
