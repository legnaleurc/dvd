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
import {
  copyStream,
  downloadStream,
  trashNodes,
} from '@/states/file_system/actions';
import { IGlobalStateType } from '@/states/reducers';
import { getMixins, useInstance } from '@/lib';
import { useComicState, useComicAction } from '@/views/hooks/comic';


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
  updating: boolean;
  count: number;
  copy: (list: string[]) => void;
  download: (list: string[]) => void;
  trash: (list: string[]) => void;
  getSelectionList: () => string[];
  clearSelection: () => void;
}


function useActions (props: IPropsType & IPrivatePropsType) {
  const { unpacking } = useComicState();
  const { loadComic } = useComicAction();
  const self = useInstance(() => ({
    async loadComic () {
      if (unpacking) {
        return;
      }
      const { getSelectionList, clearSelection } = props;
      const list = getSelectionList();
      if (list.length !== 1) {
        return;
      }
      await loadComic(list[0], '');
      clearSelection();
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
    unpacking,
    props.getSelectionList,
    props.clearSelection,
    loadComic,
    props.copy,
    props.download,
    props.trash,
  ]);

  const loadComic_ = React.useCallback(async () => {
    await self.current.loadComic();
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
    unpacking,
    loadComic: loadComic_,
    copy,
    download,
    trash,
  };
}


function ContentActionBar(props: IPropsType & IPrivatePropsType) {
  const { updating, count, clearSelection } = props;

  const classes = useStyles();
  const {
    unpacking,
    loadComic,
    copy,
    download,
    trash,
  } = useActions(props);

  return (
    <div className={classes.contentActionBar}>
      <div className={classes.group}>
        <IconButton
          disabled={unpacking || count !== 1}
          onClick={loadComic}
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
    };
  }

  function mapDispatchToProps (dispatch: Dispatch) {
    return {
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
