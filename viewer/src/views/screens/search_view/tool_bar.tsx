import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Typography, IconButton, InputBase, Portal } from '@material-ui/core';
import { makeStyles, fade } from '@material-ui/core/styles';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Compare as CompareIcon,
} from '@material-ui/icons';

import { useInstance, getMixins } from '@/lib';
import { IGlobalStateType } from '@/states/reducers';
import {
  getSearchName,
  compare,
} from '@/states/search/actions';
import { postSync } from '@/states/file_system/actions';
import {
  connectSelection,
  ISelectionStateType,
} from '@/views/hooks/selectable';
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


function useActions (
  props: IToolBarProps & IToolBarPrivateProps,
  searchName: (name: string) => void,
) {
  const self = useInstance(() => ({
    compare () {
      const { compare, getSelection } = props;
      compare(getSelection());
    },
  }), [
    props.compare,
  ]);
  const inputRef = React.useRef<HTMLInputElement>();

  const onInputReturn = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !inputRef.current) {
      return;
    }
    event.preventDefault();
    console.info(inputRef.current, inputRef.current.value);
    searchName(inputRef.current.value);
  }, [self, inputRef, searchName]);

  const compare = React.useCallback(() => {
    self.current.compare();
  }, [self]);

  return {
    inputRef,
    onInputReturn,
    compare,
  };
}


interface IToolBarProps {
  anchorEl?: HTMLDivElement;
  updating: boolean;
  sync: () => void;
  compare: (idList: string[]) => void;
}
interface IToolBarPrivateProps {
  getSelection: () => string[];
}
function ToolBar (props: IToolBarProps & IToolBarPrivateProps) {
  const { updating } = props;
  const classes = useStyles();
  const { search } = useContext();
  const {
    inputRef,
    onInputReturn,
    compare,
  } = useActions(props, search);

  if (!props.anchorEl) {
    return null;
  }

  return (
    <Portal container={props.anchorEl}>
      <div className={classes.searchToolBar}>
        <div className={classes.group}>
          <Typography variant="h6" noWrap>
            Search
          </Typography>
        </div>
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
            onClick={compare}
          >
            <CompareIcon />
          </IconButton>
          <IconButton
            className={classes.icon}
            disabled={updating}
            onClick={props.sync}
          >
            <RefreshIcon />
          </IconButton>
        </div>
      </div>
    </Portal>
  );
}
const ConnectedToolBar = (() => {
  function mapStateToProps (state: IGlobalStateType) {
    return {
      updating: state.fileSystem.updating,
    };
  }

  function mapDispatchToProps (dispatch: Dispatch) {
    return {
      searchName (name: string) {
        dispatch(getSearchName(name));
      },
      compare (idList: string[]) {
        dispatch(compare(idList));
      },
      sync () {
        dispatch(postSync());
      },
    };
  }

  const SelectableToolBar = connectSelection((
    value: ISelectionStateType,
    _ownProps: IToolBarProps,
  ) => ({
    getSelection: value.getList,
  }))(ToolBar);

  return connect(mapStateToProps, mapDispatchToProps)(SelectableToolBar);
})();
export { ConnectedToolBar as SearchViewToolBar };
