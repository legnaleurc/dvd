import React from 'react';
import { IconButton, InputBase, Portal } from '@material-ui/core';
import { makeStyles, fade } from '@material-ui/core/styles';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Compare as CompareIcon,
} from '@material-ui/icons';

import { useInstance, getMixins } from '@/lib';
import {
  useFileSystemAction,
  useFileSystemState,
} from '@/views/hooks/file_system';
import { useRichSelectableAction } from '@/views/hooks/rich_selectable';
import { useContext } from './hooks';


const useStyles = makeStyles((theme) => ({
  searchToolBar: {
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
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
    width: '15ch',
    [theme.breakpoints.up('sm')]: {
      width: 'auto',
    },
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
  icon: {},
}));


function useActions (props: IPureProps) {
  const { getSelection } = props;
  const { search, showCompare } = useContext();
  const self = useInstance(() => ({
    compare () {
      showCompare(getSelection());
    },
  }), [
    getSelection,
    showCompare,
  ]);
  const inputRef = React.useRef<HTMLInputElement>();

  const onInputReturn = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !inputRef.current) {
      return;
    }
    event.preventDefault();
    search(inputRef.current.value);
  }, [self, inputRef, search]);

  const compareSelected = React.useCallback(() => {
    self.current.compare();
  }, [self]);

  return {
    inputRef,
    onInputReturn,
    compareSelected,
  };
}


interface IPureProps {
  anchorEl?: HTMLDivElement;
  updating: boolean;
  sync: () => Promise<void>;
  getSelection: () => string[];
}
function PureToolBar (props: IPureProps) {
  const { anchorEl, updating, sync } = props;
  const classes = useStyles();
  const {
    inputRef,
    onInputReturn,
    compareSelected,
  } = useActions(props);

  if (!anchorEl) {
    return null;
  }

  return (
    <Portal container={anchorEl}>
      <div className={classes.searchToolBar}>
        <div className={classes.group}>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder="Search ..."
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'search' }}
              inputRef={inputRef}
              onKeyPress={onInputReturn}
            />
          </div>
        </div>
        <div className={classes.expand} />
        <div className={classes.group}>
          <IconButton
            className={classes.icon}
            onClick={compareSelected}
          >
            <CompareIcon />
          </IconButton>
          <IconButton
            className={classes.icon}
            disabled={updating}
            onClick={sync}
          >
            <RefreshIcon />
          </IconButton>
        </div>
      </div>
    </Portal>
  );
}
const MemorizedPureToolBar = React.memo(PureToolBar);


interface IProps {
  anchorEl?: HTMLDivElement;
}
export function ToolBar (props: IProps) {
  const { updating } = useFileSystemState();
  const { sync } = useFileSystemAction();
  const { getList } = useRichSelectableAction();
  return (
    <MemorizedPureToolBar
      anchorEl={props.anchorEl}
      updating={updating}
      sync={sync}
      getSelection={getList}
    />
  );
}
