import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { Badge, Divider, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  FileCopy as FileCopyIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  ImportContacts as ImportContactsIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from '@material-ui/icons';

import {
  connectSelection,
  ISelectionStateType,
} from '@/views/hooks/selectable';
import { loadMultiPageViewer } from '@/states/multipage/actions';
import {
  copyStream,
  downloadStream,
  trashNodes,
} from '@/states/file_system/actions';
import { IGlobalStateType } from '@/states/reducers';
import { getMixins, useInstance } from '@/lib';


const useStyles = makeStyles((theme) => ({
  contentActionBar: {
    ...getMixins([
      'h-100',
      'vbox',
    ]),
    '& > $group': {
      ...getMixins([
        'size-shrink',
        'vbox',
      ]),
    },
    '& > $expand': {
      ...getMixins([
        'size-grow',
      ]),
    },
    backgroundColor: theme.palette.background.paper,
  },
  group: {},
  expand: {},
}));


interface IPropsType {
}
interface IPrivatePropsType {
  unpacking: boolean;
  updating: boolean;
  count: number;
  mpv: (list: string[], done: () => void) => void;
  copy: (list: string[]) => void;
  download: (list: string[]) => void;
  trash: (list: string[]) => void;
  getSelectionList: () => string[];
  clearSelection: () => void;
}


function useActions (props: IPropsType & IPrivatePropsType) {
  const self = useInstance(() => ({
    mpv () {
      const { getSelectionList, clearSelection, mpv } = props;
      const list = getSelectionList();
      mpv(list, clearSelection);
    },
    copy () {
      const { getSelectionList, copy } = props;
      const list = getSelectionList();
      copy(list);
    },
    download () {
      const { getSelectionList, download } = props;
      const list = getSelectionList();
      download(list);
    },
    trash () {
      const { getSelectionList, trash } = props;
      const list = getSelectionList();
      trash(list);
    },
  }), [
    props.getSelectionList,
    props.clearSelection,
    props.mpv,
    props.copy,
    props.download,
    props.trash,
  ]);

  const mpv = React.useCallback(() => {
    self.current.mpv();
  }, [self]);
  const copy = React.useCallback(() => {
    self.current.copy();
  }, [self]);
  const download = React.useCallback(() => {
    self.current.download();
  }, [self]);
  const trash = React.useCallback(() => {
    self.current.trash();
  }, [self]);

  return {
    mpv,
    copy,
    download,
    trash,
  };
}


function ContentActionBar(props: IPropsType & IPrivatePropsType) {
  const { unpacking, updating, count, clearSelection } = props;

  const classes = useStyles();
  const {
    mpv,
    copy,
    download,
    trash,
  } = useActions(props);

  return (
    <div className={classes.contentActionBar}>
      <div className={classes.group}>
        <IconButton
          disabled={unpacking || count !== 1}
          onClick={mpv}
        >
          <ImportContactsIcon />
        </IconButton>
        <Divider />
        <IconButton
          disabled={count <= 0}
          onClick={clearSelection}
        >
          <Badge badgeContent={count} color="secondary">
            <RemoveShoppingCartIcon />
          </Badge>
        </IconButton>
        <Divider />
        <IconButton
          disabled={count <= 0}
          onClick={copy}
        >
          <FileCopyIcon />
        </IconButton>
        <IconButton
          disabled={count <= 0}
          onClick={download}
        >
          <CloudDownloadIcon />
        </IconButton>
      </div>
      <div className={classes.expand} />
      <div className={classes.group}>
        <IconButton
          color="secondary"
          disabled={updating || count <= 0}
          onClick={trash}
        >
          <DeleteIcon />
        </IconButton>
      </div>
    </div>
  );
}


const ConnectedContentActionBar = (Component => {
  function mapStateToProps (state: IGlobalStateType) {
    return {
      updating: state.fileSystem.updating,
      unpacking: state.mpv.unpacking,
    };
  }

  function mapDispatchToProps (dispatch: Dispatch) {
    return {
      mpv (list: string[], done: () => void) {
        dispatch(loadMultiPageViewer(list, done));
      },
      copy (list: string[]) {
        dispatch(copyStream(list));
      },
      download (list: string[]) {
        dispatch(downloadStream(list));
      },
      trash (list: string[]) {
        dispatch(trashNodes(list));
      },
    };
  }

  const GlobalComponent = connect(mapStateToProps, mapDispatchToProps)(Component)
  const SelectionComponent = connectSelection((value: ISelectionStateType, _ownProps: IPropsType) => ({
    count: value.count,
    getSelectionList: value.getList,
    clearSelection: value.clear,
  }))(GlobalComponent);

  return SelectionComponent;
})(ContentActionBar);
export { ConnectedContentActionBar as ContentActionBar };
